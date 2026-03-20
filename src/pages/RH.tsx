import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Users, Clock, CalendarDays, FileText, Save, CloudUpload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import * as xlsx from 'xlsx';
import { saveTimeSheetSummary, TimeSheetSummary } from '@/lib/supabase-rh';
import { PDFDocument } from 'pdf-lib';

// Initialize PDF.js worker locally to avoid 'fetch' CORS or adblock issues
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface ParsedRecord {
    Nome: string;
    Faltas: string;
    Atrasos: string;
    "Hora extra 65%": string;
    "Hora extra 100%": string;
    "Hora extra noturna": string;
    "Hora noturna": string;
    pdfBase64?: string;
}

export default function RH() {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [importedData, setImportedData] = useState<ParsedRecord[]>([]);

    // YYYY-MM
    const [referenceMonth, setReferenceMonth] = useState<string>(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const parsePdf = async (file: File): Promise<ParsedRecord[]> => {
        const arrayBuffer = await file.arrayBuffer();
        
        // Extract text with PDF.js
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        // Load original document with pdf-lib to slice pages later
        const pdfDoc = await PDFDocument.load(arrayBuffer);

        const data: ParsedRecord[] = [];

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            let text = "";
            let itemsY: { [y: number]: any[] } = {};

            // Reconstruct text maintaining lines roughly by Y position
            for (const item of textContent.items) {
                if ('str' in item) {
                    const y = Math.round(item.transform[5]);
                    if (!itemsY[y]) itemsY[y] = [];
                    itemsY[y].push(item);
                }
            }

            // Sort by descending Y to read top to bottom
            const sortedY = Object.keys(itemsY).map(Number).sort((a, b) => b - a);
            for (const y of sortedY) {
                // Sort ascending X to read left to right
                itemsY[y].sort((a, b) => a.transform[4] - b.transform[4]);
                text += itemsY[y].map(i => i.str).join(" ") + "\n";
            }

            const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

            let nome = "";
            let totals: string[] = [];

            for (let i = 0; i < lines.length; i++) {
                if (lines[i] === "NOME:" || lines[i].includes("NOME:")) {
                    for (let lookahead = 1; lookahead <= 5; lookahead++) {
                        if (i + lookahead < lines.length) {
                            const candidate = lines[i + lookahead].trim();
                            const days = ["QUI", "SEX", "SAB", "DOM", "SEG", "TER", "QUA"];
                            const hasDigit = /\d/.test(candidate);
                            const startsWithDay = days.some(d => candidate.startsWith(d));

                            if (!hasDigit && candidate.length > 5 && !startsWithDay && candidate !== "NOME:") {
                                nome = candidate;
                                break;
                            } else if (lines[i].includes("NOME:") && lines[i].replace("NOME:", "").trim().length > 5) {
                                nome = lines[i].replace("NOME:", "").trim();
                                break;
                            }
                        }
                    }
                }
                if (lines[i].startsWith("TOTAIS")) {
                    const parts = lines[i].split(/\s+/);
                    if (parts.length >= 7) {
                        totals = parts.slice(1, 7);
                        break;
                    }
                }
            }

            if (nome) {
                if (!totals || totals.length === 0) {
                    totals = ["00:00", "00:00", "00:00", "00:00", "00:00", "00:00"];
                }

                // Isolate logic for this employee single page
                let pdfBase64 = undefined;
                try {
                    const newPdf = await PDFDocument.create();
                    const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
                    newPdf.addPage(copiedPage);
                    pdfBase64 = await newPdf.saveAsBase64({ dataUri: true });
                } catch (err) {
                    console.error(`Erro ao extrair página PDF para o funcionário ${nome}`, err);
                }

                data.push({
                    Nome: nome,
                    Faltas: totals[2],
                    Atrasos: totals[1],
                    "Hora extra 65%": totals[3],
                    "Hora extra 100%": totals[4],
                    "Hora extra noturna": totals[0],
                    "Hora noturna": totals[5],
                    pdfBase64
                });
            }
        }
        return data;
    }

    const parseExcel = async (file: File): Promise<ParsedRecord[]> => {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<ParsedRecord>(worksheet);
        return json;
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            let extractedData: ParsedRecord[] = [];
            if (file.name.toLowerCase().endsWith('.pdf')) {
                extractedData = await parsePdf(file);
            } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.csv')) {
                extractedData = await parseExcel(file);
            } else {
                throw new Error("Formato não suportado. Por favor, envie um arquivo .pdf ou .xlsx / .csv.");
            }

            if (extractedData.length > 0) {
                setImportedData(extractedData);
                toast({
                    title: "Sucesso",
                    description: `Arquivo processado. ${extractedData.length} funcionário(s) encontrado(s).`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Sem dados",
                    description: "Não foi possível encontrar funcionários com a estrutura 'NOME:' e 'TOTAIS' no arquivo.",
                });
            }

        } catch (error: any) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Erro ao importar",
                description: error.message || "Falha na leitura do arquivo.",
            });
        } finally {
            setIsUploading(false);
            e.target.value = '';
        }
    };

    const handleSaveToDatabase = async () => {
        if (importedData.length === 0) return;

        setIsSaving(true);
        try {
            const mappedRecords: TimeSheetSummary[] = importedData.map(r => ({
                reference_month: referenceMonth,
                employee_name: r.Nome,
                total_overtime_65: r["Hora extra 65%"],
                total_overtime_100: r["Hora extra 100%"],
                total_night_shift: r["Hora noturna"], // mapeando noturna pro field principal noturno extra
                total_delays: r.Atrasos,
                total_faults: r.Faltas
            }));

            await saveTimeSheetSummary(mappedRecords, referenceMonth);

            toast({
                title: "Lançamentos Salvos!",
                description: "O fechamento de ponto foi gravado no banco de dados corporativo.",
            });
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: err.message || "Falha ao gravar no Supabase.",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSyncToDrive = async () => {
        if (importedData.length === 0) return;
        setIsSyncing(true);

        const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL_RH || "https://seu-webhook-do-n8n-aqui";

        try {
            if (n8nWebhookUrl === "https://seu-webhook-do-n8n-aqui") {
                throw new Error("⚠️ Configure a URL do webhook VITE_N8N_WEBHOOK_URL_RH no seu .env para poder enviar!");
            }

            for (const record of importedData) {
                if (!record.pdfBase64) continue;
                
                // Envia para o webhook
                const payload = {
                    nome: record.Nome,
                    mes: referenceMonth,
                    arquivoBase64: record.pdfBase64.split(',')[1] // Only send the raw base64 string
                };

                await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            
            toast({
                title: "Sucesso",
                description: "Arquivos PDFs enviados para o webhook com sucesso!",
            });
        } catch (error: any) {
             toast({
                variant: "destructive",
                title: "Erro na sincronização Google Drive",
                description: error.message || "Falha ao enviar os dados para o Drive.",
            });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-delay-1 print:space-y-0 print:m-0">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold font-serif text-gold">Recursos Humanos</h1>
                    <p className="text-muted-foreground mt-1">Gestão de Equipe e Fechamento (Secullum Web Pro)</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-gold/30 text-gold hover:bg-gold/10">
                        <Users className="w-4 h-4 mr-2" /> Novo Funcionário
                    </Button>
                    <div className="relative">
                        <Input
                            type="file"
                            accept=".pdf,.xlsx,.csv"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                        <Button disabled={isUploading} className="bg-gold text-teal font-semibold hover:bg-gold-light">
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? 'Processando...' : 'Importar Relatório'}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
                <Card className="border-gold/20 shadow-soft">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Equipe no Relatório</CardTitle>
                        <Users className="w-4 h-4 text-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">{importedData.length > 0 ? importedData.length : '0'}</div>
                        <p className="text-xs text-muted-foreground">Funcionários extraídos</p>
                    </CardContent>
                </Card>

                <Card className="border-gold/20 shadow-soft">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Situação de Leitura</CardTitle>
                        <Clock className="w-4 h-4 text-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold font-serif ${importedData.length > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>{importedData.length > 0 ? 'Concluída' : '--'}</div>
                        <p className="text-xs text-muted-foreground">{importedData.length > 0 ? 'Pronto para gravação' : 'Aguardando ação'}</p>
                    </CardContent>
                </Card>

                <Card className="border-gold/20 shadow-soft">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Mês de Referência</CardTitle>
                        <CalendarDays className="w-4 h-4 text-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="month"
                                value={referenceMonth}
                                onChange={e => setReferenceMonth(e.target.value)}
                                className="h-8 mt-1 border-gold/30 bg-background/50"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gold/20 shadow-soft">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total de Horas Extras</CardTitle>
                        <CalendarDays className="w-4 h-4 text-gold" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-serif">{importedData.length > 0 ? importedData.filter(d => d["Hora extra 65%"] !== "00:00" || d["Hora extra 100%"] !== "00:00").length : '0'}</div>
                        <p className="text-xs text-muted-foreground">Funcionários para fechar extra</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="fechamento" className="w-full">
                <TabsList className="bg-teal-light border border-gold/20 print:hidden">
                    <TabsTrigger value="fechamento" className="data-[state=active]:bg-gold data-[state=active]:text-teal data-[state=active]:font-semibold">Fechamento Consolidado</TabsTrigger>
                    <TabsTrigger value="funcionarios" className="data-[state=active]:bg-gold data-[state=active]:text-teal data-[state=active]:font-semibold">Quadro de Funcionários</TabsTrigger>
                    <TabsTrigger value="espelho" className="data-[state=active]:bg-gold data-[state=active]:text-teal data-[state=active]:font-semibold">Inconsistências</TabsTrigger>
                </TabsList>

                <TabsContent value="fechamento" className="mt-4">
                    <Card className="border-gold/20 shadow-elegant">
                        <CardHeader>
                            <CardTitle className="font-serif text-2xl text-gold">Visão Final da Folha</CardTitle>
                            <CardDescription>Resumo dos totais de Atrasos, Faltas e Horas Extras gerados pelo Secullum.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {importedData.length === 0 ? (
                                <div className="flex flex-col h-40 items-center justify-center border-2 border-dashed border-gold/20 rounded-lg bg-teal-light/50">
                                    <FileText className="h-8 w-8 text-gold/50 mb-4" />
                                    <p className="text-muted-foreground">O relatório final (PDF ou Planilha) ainda não foi importado.</p>
                                </div>
                            ) : (
                                <div className="rounded-md border border-gold/20 overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="border-b border-gold/20 bg-teal-light">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-medium text-gold">Colaborador</th>
                                                <th className="px-4 py-3 text-left font-medium text-gold">Faltas</th>
                                                <th className="px-4 py-3 text-left font-medium text-destructive">Atrasos</th>
                                                <th className="px-4 py-3 text-left font-medium text-emerald-400">Extra (65%)</th>
                                                <th className="px-4 py-3 text-left font-medium text-emerald-400">Extra (100%)</th>
                                                <th className="px-4 py-3 text-left font-medium text-gold">Ad. Noturno</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gold/10">
                                            {importedData.map((record, i) => (
                                                <tr key={i} className="hover:bg-teal-light/50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-foreground">{record.Nome}</td>
                                                    <td className="px-4 py-3">{record.Faltas !== "00:00" ? record.Faltas : '-'}</td>
                                                    <td className="px-4 py-3 text-destructive font-semibold">{record.Atrasos !== "00:00" ? record.Atrasos : '-'}</td>
                                                    <td className="px-4 py-3 text-emerald-400 font-semibold">{record['Hora extra 65%'] !== "00:00" ? record['Hora extra 65%'] : '-'}</td>
                                                    <td className="px-4 py-3 text-emerald-400 font-semibold">{record['Hora extra 100%'] !== "00:00" ? record['Hora extra 100%'] : '-'}</td>
                                                    <td className="px-4 py-3">{record['Hora noturna'] !== "00:00" ? record['Hora noturna'] : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-teal-light border-t border-gold/20 print:hidden">
                                            <tr>
                                                <td colSpan={6} className="px-4 py-4 mt-2">
                                                    <div className="flex flex-col md:flex-row items-center justify-end gap-4 w-full">
                                                        <Button
                                                            variant="outline"
                                                            onClick={handleSyncToDrive}
                                                            disabled={isSyncing || importedData.length === 0 || !importedData.some(d => d.pdfBase64)}
                                                            className="border-gold/30 text-gold hover:bg-gold/10 w-full md:w-auto"
                                                        >
                                                            {isSyncing ? 'Sincronizando...' : (
                                                                <>
                                                                    <CloudUpload className="w-4 h-4 mr-2" />
                                                                    Enviar PDFs p/ Drive via n8n
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            onClick={handleSaveToDatabase}
                                                            disabled={isSaving}
                                                            className="bg-gold text-teal font-bold hover:bg-gold-light w-full md:w-auto"
                                                        >
                                                            {isSaving ? 'Salvando...' : (
                                                                <>
                                                                    <Save className="w-4 h-4 mr-2" />
                                                                    Registrar Lançamentos Definitivos
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="funcionarios" className="mt-4">
                    <Card className="border-gold/20 shadow-elegant">
                        <CardHeader>
                            <CardTitle className="font-serif text-2xl text-gold">Colaboradores</CardTitle>
                            <CardDescription>Gerencie o cadastro da equipe e unidades de negócio.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col h-32 items-center justify-center border-2 border-dashed border-gold/20 rounded-lg">
                                <Users className="h-8 w-8 text-gold/30 mb-2" />
                                <p className="text-muted-foreground">Integração com Perfil de Funcionários em desenvolvimento.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="espelho" className="mt-4">
                    <Card className="border-gold/20 shadow-elegant">
                        <CardHeader>
                            <CardTitle className="font-serif text-2xl text-gold">Inconsistências Reportadas</CardTitle>
                            <CardDescription>Eventos de Faltas Não Justificadas / Feriados / Omissões.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col h-32 items-center justify-center border-2 border-dashed border-gold/20 rounded-lg">
                                <Clock className="h-8 w-8 text-gold/30 mb-2" />
                                <p className="text-muted-foreground">Detalhes individuais ausentes no extrato sintético. Inspecione o Secullum.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
