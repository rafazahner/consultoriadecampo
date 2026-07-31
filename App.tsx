
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Building, Info, Loader2, AlertCircle, ChevronRight, UserSearch, RefreshCw, GraduationCap, BookOpen, CheckCircle2, Clock, PlayCircle, TrendingUp, MapPin, User, FileDown, Calculator, Send, CalendarClock } from 'lucide-react';
import { Unit } from './types';
import { UnitCard } from './components/UnitCard';
import { containsSearchTerm } from './utils/searchUtils';

const LOGO_URL = "/logo.png";

interface TreinamentoRetorno {
  'Usuário': string;
  'Data de Nascimento': string;
  'Perfil': string;
  'E-mail': string;
  'Unidade Relacionadas ao Usuário': string[];
  'Total de Cursos': string;
  'Em Andamento': string;
  'Não Iniciados': string;
  'Concluídos': string;
  'Progresso (%)': string;
  'Última Curso Concluído': string;
}

interface ColaboradorUnidade {
  'Aluno': string;
  'Unidade': string;
  'Perfil': string;
  'Progresso': number | string;
  'Total de cursos': number;
  'A fazer': number | string;
  'Em andamento': number | string;
  'Concluídos': number | string;
  'Média das notas': number | string;
  'Último conteúdo assistido': string;
  'Último curso concluído': string;
}


const App: React.FC = () => {
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'unidade' | 'consultor' | 'treinamentos' | 'treinamentos-unidade' | 'calculadora-disparo'>('unidade');

  const [calcAtivos, setCalcAtivos] = useState('');
  const [calcDataInicio, setCalcDataInicio] = useState('');
  const [calcHoraInicio, setCalcHoraInicio] = useState('07:00');
  const [calcResultado, setCalcResultado] = useState<{
    fimData: string;
    fimHora: string;
    totalDias: number;
    ultimoDiaDisparos: number;
  } | null>(null);

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const [treinamentoQuery, setTreinamentoQuery] = useState('');
  const [treinamentoResult, setTreinamentoResult] = useState<TreinamentoRetorno | null>(null);
  const [treinamentoSearched, setTreinamentoSearched] = useState(false);
  const [treinamentoMensagem, setTreinamentoMensagem] = useState<string | null>(null);
  const [treinamentoSuggestions, setTreinamentoSuggestions] = useState<string[]>([]);
  const [treinamentoLoadingSuggestions, setTreinamentoLoadingSuggestions] = useState(false);
  const [showTreinamentoSuggestions, setShowTreinamentoSuggestions] = useState(false);
  const treinamentoSuggestionsRef = useRef<HTMLDivElement>(null);
  const treinamentoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [unidadesList, setUnidadesList] = useState<string[]>([]);
  const [unidadesLoading, setUnidadesLoading] = useState(false);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string | null>(null);
  const [showUnidadeDropdown, setShowUnidadeDropdown] = useState(false);
  const [colaboradoresUnidade, setColaboradoresUnidade] = useState<ColaboradorUnidade[]>([]);
  const [colaboradoresLoading, setColaboradoresLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/dados', { cache: 'no-store' });

        if (!response.ok) throw new Error('Falha ao conectar com a API Microsoft Graph');

        const data = await response.json();
        const rows: unknown[][] = data.values ?? [];

        // colunas: 0=UNIDADE, 1=COD, 2=UF, 3=INAUG., 4=CIDADE, 7=FRANQUIA, 8=FRANQUEADO,
        // 13=LIFE TIME, 14=TICKET MÉDIO, 15=LTV, 16=GOLD, 17=PISCINA, 18=STUDIOS,
        // 22=WELLHUB, 23=TOTALPASS, 24=CONSULTOR
        const mappedUnits: Unit[] = rows.slice(1)
          .filter(row => row[0])
          .map((row, index) => ({
            id: String(index + 1),
            codUnidade: String(row[1] ?? '').trim(),
            unidade: String(row[0] ?? '').trim(),
            cidade: String(row[4] ?? 'Não informada').trim(),
            franquia: String(row[7] ?? 'N/A').trim(),
            franqueado: String(row[8] ?? 'N/A').trim(),
            consultorCampo: String(row[24] ?? 'N/A').trim(),
            inauguracao: String(row[3] ?? '').trim(),
            piscina: String(row[17] ?? 'N/A').trim(),
            studios: String(row[18] ?? 'N/A').trim(),
            wellhub: String(row[22] ?? 'N/A').trim(),
            totalpass: String(row[23] ?? 'N/A').trim(),
            lifetime: String(row[13] ?? 'N/A').trim(),
            ticketMedio: String(row[14] ?? 'N/A').trim(),
            ltv: String(row[15] ?? 'N/A').trim(),
            gold: String(row[16] ?? 'N/A').trim(),
          }));

        const uniqueUnits = mappedUnits.filter((unit, index, self) =>
          index === self.findIndex(u => u.unidade === unit.unidade)
        );

        setUnidades(uniqueUnits);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar dados da planilha.");
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => { fetchData(); }, []);

  const results = useMemo(() => {
    if (!submittedQuery.trim()) return [];

    return unidades.filter(u => {
      if (searchMode === 'unidade') {
        return containsSearchTerm(u.unidade, submittedQuery) || u.id === submittedQuery;
      } else {
        return containsSearchTerm(u.consultorCampo, submittedQuery);
      }
    });
  }, [submittedQuery, unidades, searchMode]);

  const suggestions = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const unique = new Set<string>();

    unidades.forEach(u => {
      const fieldToSearch = (searchMode === 'unidade' ? u.unidade : u.consultorCampo).trim().toUpperCase();
      if (containsSearchTerm(fieldToSearch, query)) unique.add(fieldToSearch);
    });

    return Array.from(unique).slice(0, 5);
  }, [query, unidades, searchMode]);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmittedQuery(query);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    setSubmittedQuery('');
  };

  const fetchColaboradoresUnidade = async (unidade: string) => {
    setColaboradoresUnidade([]);
    setColaboradoresLoading(true);
    try {
      const url = new URL('https://script.google.com/macros/s/AKfycby7vMu1WocaeHyruf2u9E-0rqAZ11Ye1OIOvBXvNBpScNOyuL5MQuv8j_WlqZSm1PYi/exec');
      url.searchParams.set('endpoint', 'colaboradores');
      url.searchParams.set('unidade', unidade);
      const res = await fetch(url.toString());
      const data = await res.json();
      const lista = Array.isArray(data.colaboradores) ? data.colaboradores : [];
      lista.sort((a, b) => {
        const pa = typeof a['Progresso'] === 'number' ? a['Progresso'] : -1;
        const pb = typeof b['Progresso'] === 'number' ? b['Progresso'] : -1;
        return pb - pa;
      });
      setColaboradoresUnidade(lista);
    } catch {
      setColaboradoresUnidade([]);
    } finally {
      setColaboradoresLoading(false);
    }
  };

  const fetchTreinamentoSuggestions = (value: string) => {
    if (treinamentoDebounceRef.current) clearTimeout(treinamentoDebounceRef.current);
    if (value.trim().length < 2) { setTreinamentoSuggestions([]); setShowTreinamentoSuggestions(false); return; }
    treinamentoDebounceRef.current = setTimeout(async () => {
      setTreinamentoLoadingSuggestions(true);
      try {
        const url = new URL('https://script.google.com/macros/s/AKfycbz0G-QU-ECsZN1Rmk1dsiKP6s-06MSoALN6j1hVBnV139WWhE07p6JBznZS2IZySDB-CQ/exec');
        url.searchParams.set('nome', value.trim());
        const res = await fetch(url.toString());
        const data = await res.json();
        setTreinamentoSuggestions(Array.isArray(data) ? data : []);
        setShowTreinamentoSuggestions(true);
      } catch {
        setTreinamentoSuggestions([]);
      } finally {
        setTreinamentoLoadingSuggestions(false);
      }
    }, 350);
  };

  const handleTreinamentoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTreinamentoQuery(value);
    setTreinamentoResult(null);
    setTreinamentoSearched(false);
    fetchTreinamentoSuggestions(value);
  };

  const handleSelectSuggestion = (nome: string) => {
    setTreinamentoQuery(nome);
    setShowTreinamentoSuggestions(false);
    setTreinamentoSuggestions([]);
    // dispara a busca automaticamente ao selecionar
    handleTreinamentoSearchByName(nome);
  };

  const handleTreinamentoSearchByName = async (nome: string) => {
    setTreinamentoResult(null);
    setTreinamentoMensagem(null);
    setTreinamentoSearched(false);
    setLoading(true);
    try {
      const url = new URL('https://script.google.com/macros/s/AKfycbzhbEUXPH_mNC0tBPUb68dAxUhnX_yStKr19ecZnqGioqGwz03wWGVKVVeJ3wzBFbo6/exec');
      url.searchParams.set('nome', nome.trim());
      const res = await fetch(url.toString());
      const json = await res.json();
      const data = json?.data ?? json;
      if (data.error_code === 0 && Array.isArray(data.retorno) && data.retorno.length > 0) {
        setTreinamentoResult(data.retorno[0]);
      } else {
        setTreinamentoResult(null);
        setTreinamentoMensagem(data.message_return ?? null);
      }
    } catch {
      setTreinamentoResult(null);
      setTreinamentoMensagem(null);
    } finally {
      setTreinamentoSearched(true);
      setLoading(false);
    }
  };

  const handleTreinamentoSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!treinamentoQuery.trim()) return;
    setShowTreinamentoSuggestions(false);
    handleTreinamentoSearchByName(treinamentoQuery.trim());
  };

  const handleTreinamentoClear = () => {
    setTreinamentoQuery('');
    setTreinamentoResult(null);
    setTreinamentoSearched(false);
    setTreinamentoMensagem(null);
    setTreinamentoSuggestions([]);
    setShowTreinamentoSuggestions(false);
  };

  const fetchUnidades = async () => {
    if (unidadesList.length > 0) return;
    setUnidadesLoading(true);
    try {
      const res = await fetch('https://script.google.com/macros/s/AKfycby7vMu1WocaeHyruf2u9E-0rqAZ11Ye1OIOvBXvNBpScNOyuL5MQuv8j_WlqZSm1PYi/exec?endpoint=unidades');
      const data = await res.json();
      setUnidadesList(Array.isArray(data.unidades) ? data.unidades : []);
    } catch {
      setUnidadesList([]);
    } finally {
      setUnidadesLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
  };

  const JANELA_INICIO_MIN = 7 * 60; // 07:00
  const JANELA_FIM_MIN = 23 * 60 + 30; // 23:30
  const INTERVALO_MIN = 4;

  const handleCalcularDisparo = (e?: React.FormEvent) => {
    e?.preventDefault();
    const ativos = parseInt(calcAtivos, 10);
    if (!ativos || ativos <= 0 || !calcDataInicio || !calcHoraInicio) {
      setCalcResultado(null);
      return;
    }

    const [horaIni, minIni] = calcHoraInicio.split(':').map(Number);
    let minutoAtualDoDia = horaIni * 60 + minIni;

    // Se o horário de início estiver fora da janela do dia, avança para a janela válida
    if (minutoAtualDoDia < JANELA_INICIO_MIN) minutoAtualDoDia = JANELA_INICIO_MIN;

    let diaOffset = minutoAtualDoDia > JANELA_FIM_MIN ? 1 : 0;
    if (diaOffset === 1) minutoAtualDoDia = JANELA_INICIO_MIN;

    let disparosRestantes = ativos;
    let ultimoDiaDisparos = 0;
    let minutoUltimoDisparo = minutoAtualDoDia;

    while (disparosRestantes > 0) {
      const disparosPossiveisNoDia = Math.floor((JANELA_FIM_MIN - minutoAtualDoDia) / INTERVALO_MIN) + 1;

      if (disparosRestantes <= disparosPossiveisNoDia) {
        minutoUltimoDisparo = minutoAtualDoDia + (disparosRestantes - 1) * INTERVALO_MIN;
        ultimoDiaDisparos = disparosRestantes;
        disparosRestantes = 0;
      } else {
        disparosRestantes -= disparosPossiveisNoDia;
        diaOffset += 1;
        minutoAtualDoDia = JANELA_INICIO_MIN;
      }
    }

    const dataBase = new Date(`${calcDataInicio}T00:00:00`);
    dataBase.setDate(dataBase.getDate() + diaOffset);

    const horaFim = Math.floor(minutoUltimoDisparo / 60);
    const minFim = minutoUltimoDisparo % 60;

    setCalcResultado({
      fimData: dataBase.toLocaleDateString('pt-BR'),
      fimHora: `${String(horaFim).padStart(2, '0')}:${String(minFim).padStart(2, '0')}`,
      totalDias: diaOffset + 1,
      ultimoDiaDisparos,
    });
  };

  const handleCalcularDisparoClear = () => {
    setCalcAtivos('');
    setCalcDataInicio('');
    setCalcHoraInicio('07:00');
    setCalcResultado(null);
  };

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* LOADING POPUP */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 px-16 py-12 border border-slate-100">
            <Loader2 className="w-14 h-14 text-[#2fabab] animate-spin" />
            <p className="text-slate-700 font-black text-xl uppercase tracking-[0.25em]">Carregando Informações...</p>
          </div>
        </div>
      )}

      {/* SIDEBAR: Left Navigation Menu */}
      <aside className="hidden lg:flex lg:w-72 xl:w-80 bg-gradient-to-br from-[#1a0f24] via-[#2a1030] to-[#3a1240] border-r border-slate-100 relative lg:h-screen lg:sticky lg:top-0 flex-col overflow-hidden">
        <div className="relative z-10 flex flex-col h-full">
          <div className="px-8 pt-10 pb-8 border-b border-white/10 flex items-center justify-center">
            <img
              src={LOGO_URL}
              alt="Ultra Academia"
              className="h-36 w-auto object-contain"
            />
          </div>

          <div className="px-8 pt-8 pb-3">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Navegação</span>
          </div>

          <nav className="flex flex-col gap-1 px-4">
            <button
              onClick={() => { setSearchMode('unidade'); handleClear(); }}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold transition-all duration-300 ${searchMode === 'unidade' ? 'bg-white/10 text-white border-l-4 border-[#2fabab]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent'}`}
            >
              <Building className="w-5 h-5" />
              Unidades
            </button>
            <button
              onClick={() => { setSearchMode('consultor'); handleClear(); }}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold transition-all duration-300 ${searchMode === 'consultor' ? 'bg-white/10 text-white border-l-4 border-[#c23c8e]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent'}`}
            >
              <UserSearch className="w-5 h-5" />
              Consultores
            </button>
            <button
              onClick={() => { setSearchMode('treinamentos'); handleClear(); }}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold transition-all duration-300 ${searchMode === 'treinamentos' ? 'bg-white/10 text-white border-l-4 border-[#f08228]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent'}`}
            >
              <GraduationCap className="w-5 h-5" />
              Treinamentos Colaborador
            </button>
            <button
              onClick={() => { setSearchMode('treinamentos-unidade'); handleClear(); fetchUnidades(); }}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold transition-all duration-300 ${searchMode === 'treinamentos-unidade' ? 'bg-white/10 text-white border-l-4 border-[#2fabab]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent'}`}
            >
              <Building className="w-5 h-5" />
              Treinamentos Unidades
            </button>
            <button
              onClick={() => { setSearchMode('calculadora-disparo'); handleCalcularDisparoClear(); }}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-bold transition-all duration-300 ${searchMode === 'calculadora-disparo' ? 'bg-white/10 text-white border-l-4 border-[#c23c8e]' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-4 border-transparent'}`}
            >
              <Calculator className="w-5 h-5" />
              Calculadora de Disparo
            </button>
          </nav>
        </div>
      </aside>

      {/* MAIN: Search Engine */}
      <main className="flex-1 min-h-screen flex flex-col p-4 sm:p-8 lg:p-12 xl:p-24">
        {/* Header content skipped for brevity... */}
        <header className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center gap-8 mb-14">
            <div className="sm:ml-auto">
              <button
                onClick={fetchData}
                disabled={loading}
                title="Atualizar dados"
                className="flex items-center gap-2 px-4 py-3 bg-slate-100/80 border border-slate-200 rounded-[1.2rem] text-slate-500 hover:text-[#2fabab] hover:border-[#2fabab] transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="relative group">
            <h2 className="text-4xl sm:text-7xl xl:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] uppercase mb-4">
              {searchMode === 'treinamentos' ? (
                <>Treinamentos <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f08228] via-[#c23c8e] to-[#f08228]">Colaborador</span></>
              ) : searchMode === 'treinamentos-unidade' ? (
                <>Treinamentos <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2fabab] via-[#c23c8e] to-[#2fabab]">Unidades</span></>
              ) : searchMode === 'calculadora-disparo' ? (
                <>Calculadora <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c23c8e] via-[#f08228] to-[#c23c8e]">de Disparo</span></>
              ) : (
                <>Pesquisa <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2fabab] via-[#c23c8e] to-[#f08228]">Consultoria de Campo</span></>
              )}
            </h2>
            <div className="h-2.5 w-56 bg-gradient-to-r from-[#2fabab] via-[#c23c8e] to-[#f08228] rounded-full mt-8 group-hover:w-full transition-all duration-1000"></div>
          </div>
        </header>

        {/* SEARCH BOX — modo treinamentos */}
        {searchMode === 'calculadora-disparo' ? (
          <section className="flex-grow pb-24">
            <form onSubmit={handleCalcularDisparo} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100 p-8 sm:p-12 mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Nº de Ativos da Unidade</label>
                  <input
                    type="number"
                    min={1}
                    value={calcAtivos}
                    onChange={(e) => setCalcAtivos(e.target.value)}
                    placeholder="Ex: 350"
                    className="w-full px-6 py-5 bg-slate-50 border-[3px] border-slate-50 rounded-[1.5rem] text-slate-900 font-black text-xl focus:outline-none focus:border-[#c23c8e] focus:ring-4 focus:ring-[#c23c8e]/10 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Data de Início</label>
                  <input
                    type="date"
                    value={calcDataInicio}
                    onChange={(e) => setCalcDataInicio(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50 border-[3px] border-slate-50 rounded-[1.5rem] text-slate-900 font-black text-xl focus:outline-none focus:border-[#c23c8e] focus:ring-4 focus:ring-[#c23c8e]/10 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3">Hora de Início</label>
                  <input
                    type="time"
                    value={calcHoraInicio}
                    onChange={(e) => setCalcHoraInicio(e.target.value)}
                    className="w-full px-6 py-5 bg-slate-50 border-[3px] border-slate-50 rounded-[1.5rem] text-slate-900 font-black text-xl focus:outline-none focus:border-[#c23c8e] focus:ring-4 focus:ring-[#c23c8e]/10 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <p className="text-slate-400 font-bold text-sm mb-8">
                Janela de disparo diária: <span className="text-slate-700">07:00 às 23:30</span> · Intervalo entre disparos: <span className="text-slate-700">4 minutos</span>
              </p>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  className="flex items-center gap-3 bg-[#c23c8e] hover:bg-[#a63279] shadow-2xl shadow-[#c23c8e]/30 text-white font-black py-4 px-10 rounded-[1.5rem] transition-all active:scale-95 text-sm tracking-[0.2em] uppercase italic"
                >
                  <Calculator className="w-5 h-5" />
                  Calcular
                </button>
                <button
                  type="button"
                  onClick={handleCalcularDisparoClear}
                  className="text-slate-400 hover:text-slate-600 font-black text-xs uppercase tracking-widest px-6 py-4 transition-colors"
                >
                  Limpar
                </button>
              </div>
            </form>

            {calcResultado ? (
              <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-100 overflow-hidden">
                <div className="h-3 bg-gradient-to-r from-[#c23c8e] via-[#f08228] to-[#c23c8e]" />
                <div className="p-8 sm:p-12">
                  <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-[#c23c8e]/10 flex items-center justify-center flex-shrink-0">
                      <Send className="w-8 h-8 text-[#c23c8e]" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Resultado do Cálculo</p>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">Disparo será concluído</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#c23c8e]/5 border border-[#c23c8e]/15 rounded-[1.5rem] p-6 flex flex-col items-center gap-2">
                      <CalendarClock className="w-7 h-7 text-[#c23c8e]" />
                      <span className="text-2xl font-black text-slate-900">{calcResultado.fimData}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Data Final</span>
                    </div>
                    <div className="bg-[#f08228]/5 border border-[#f08228]/15 rounded-[1.5rem] p-6 flex flex-col items-center gap-2">
                      <Clock className="w-7 h-7 text-[#f08228]" />
                      <span className="text-2xl font-black text-slate-900">{calcResultado.fimHora}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Hora do Último Disparo</span>
                    </div>
                    <div className="bg-[#2fabab]/5 border border-[#2fabab]/15 rounded-[1.5rem] p-6 flex flex-col items-center gap-2">
                      <BookOpen className="w-7 h-7 text-[#2fabab]" />
                      <span className="text-2xl font-black text-slate-900">{calcResultado.totalDias}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{calcResultado.totalDias === 1 ? 'Dia Necessário' : 'Dias Necessários'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 opacity-20 select-none grayscale hover:grayscale-0 transition-all duration-1000">
                <Calculator className="w-40 h-40 text-slate-200 mb-10" />
                <p className="text-slate-400 font-black tracking-[0.4em] uppercase text-sm">Preencha os dados e calcule</p>
              </div>
            )}
          </section>
        ) : searchMode === 'treinamentos-unidade' ? (
          <>
            {/* POPUP carregando unidades */}
            {unidadesLoading && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-6 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 px-16 py-12 border border-slate-100">
                  <Loader2 className="w-14 h-14 text-[#2fabab] animate-spin" />
                  <p className="text-slate-700 font-black text-xl uppercase tracking-[0.25em]">Carregando Unidades...</p>
                </div>
              </div>
            )}

            <div className="mb-16">
              <div className="relative">
                {/* Botão select estilizado */}
                <button
                  type="button"
                  onClick={() => setShowUnidadeDropdown(v => !v)}
                  className={`flex items-center w-full pl-20 sm:pl-28 pr-16 py-6 sm:py-10 bg-slate-50 border-[3px] rounded-[2.5rem] sm:rounded-[3.5rem] text-left transition-all shadow-inner ${showUnidadeDropdown ? 'border-[#2fabab] ring-4 sm:ring-8 ring-[#2fabab]/10 bg-white' : 'border-slate-50'}`}
                >
                  <Building className={`absolute left-12 w-6 h-6 sm:w-8 sm:h-8 ${unidadeSelecionada ? 'text-[#2fabab]' : 'text-slate-200'} transition-colors duration-500`} />
                  <span className={`text-lg sm:text-3xl font-black tracking-tighter truncate ${unidadeSelecionada ? 'text-slate-900' : 'text-slate-200'}`}>
                    {unidadeSelecionada ?? 'Selecione a unidade...'}
                  </span>
                  <ChevronRight className={`absolute right-10 w-6 h-6 text-slate-300 transition-transform duration-300 ${showUnidadeDropdown ? 'rotate-90' : ''}`} />
                </button>

                {unidadeSelecionada && (
                  <button
                    type="button"
                    onClick={() => { setUnidadeSelecionada(null); setShowUnidadeDropdown(false); setColaboradoresUnidade([]); }}
                    className="absolute inset-y-0 right-14 flex items-center text-slate-300 hover:text-slate-600 transition-colors pr-4"
                  >
                    <X className="h-5 w-5 sm:h-7 sm:w-7" />
                  </button>
                )}

                {/* Dropdown lista */}
                {showUnidadeDropdown && (
                  <div className="absolute z-30 w-full mt-4 bg-white/98 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden max-h-[400px] overflow-y-auto">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/60 sticky top-0">
                      <span className="text-[10px] font-black text-[#2fabab] uppercase tracking-[0.5em]">{unidadesList.length} Unidades Disponíveis</span>
                    </div>
                    {unidadesList.map((u, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setUnidadeSelecionada(u); setShowUnidadeDropdown(false); fetchColaboradoresUnidade(u); }}
                        className={`w-full text-left px-10 py-4 flex items-center justify-between group transition-colors border-b border-slate-50/60 last:border-0 ${unidadeSelecionada === u ? 'bg-[#2fabab]/5' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${unidadeSelecionada === u ? 'bg-[#2fabab] text-white' : 'bg-[#2fabab]/10 text-[#2fabab]'}`}>
                            <Building className="w-3.5 h-3.5" />
                          </div>
                          <span className={`font-bold text-sm sm:text-base tracking-tight ${unidadeSelecionada === u ? 'text-[#2fabab]' : 'text-slate-700'}`}>{u}</span>
                        </div>
                        {unidadeSelecionada === u && <CheckCircle2 className="w-5 h-5 text-[#2fabab] flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <section className="flex-grow pb-24">
              {/* Popup carregando colaboradores */}
              {colaboradoresLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-6 bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 px-16 py-12 border border-slate-100">
                    <Loader2 className="w-14 h-14 text-[#2fabab] animate-spin" />
                    <p className="text-slate-700 font-black text-xl uppercase tracking-[0.25em]">Buscando Treinamentos...</p>
                  </div>
                </div>
              )}

              {unidadeSelecionada && colaboradoresUnidade.length > 0 ? (
                <div className="animate-in fade-in slide-in-from-bottom-10 duration-700" id="print-area">
                  {/* Header da unidade */}
                  <div style={{breakInside: 'avoid', pageBreakInside: 'avoid'}} className="flex items-center gap-6 p-8 sm:p-10 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100 mb-8">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-[#2fabab]/10 flex items-center justify-center flex-shrink-0">
                      <Building className="w-8 h-8 text-[#2fabab]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Unidade</p>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{unidadeSelecionada}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-[#2fabab] bg-[#2fabab]/10 px-4 py-2 rounded-full uppercase tracking-widest">{colaboradoresUnidade.filter(c => c['Perfil'] !== 'Administrativo').length} colaboradores</span>
                      <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-2 px-5 py-2.5 bg-[#2fabab] hover:bg-[#258a8a] text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all active:scale-95 shadow-lg shadow-[#2fabab]/30"
                      >
                        <FileDown className="w-4 h-4" />
                        Exportar PDF
                      </button>
                    </div>
                  </div>

                  {/* Cards dos colaboradores */}
                  <div className="flex flex-col gap-4">
                    {colaboradoresUnidade.filter(c => c['Perfil'] !== 'Administrativo').map((c, i) => {
                      const progresso = typeof c['Progresso'] === 'number' ? c['Progresso'] : null;
                      const progressoValido = progresso !== null && !isNaN(progresso);
                      return (
                        <div key={i} style={{breakInside: 'avoid', pageBreakInside: 'avoid'}} className={`bg-white rounded-[2rem] shadow-lg overflow-hidden ${progresso !== 100 ? 'border-2 border-red-400 animate-pulse shadow-red-100' : 'border border-slate-100 shadow-slate-50'}`}>
                          <div className="h-1.5 bg-gradient-to-r from-[#2fabab] via-[#c23c8e] to-[#f08228]" style={{ width: `${progressoValido ? Math.max(progresso, 2) : 100}%`, background: progressoValido && progresso === 100 ? 'linear-gradient(to right, #2fabab, #2fabab)' : undefined }} />
                          <div className="p-6 sm:p-8">
                            {/* Nome e perfil */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
                              <div className="w-12 h-12 rounded-[1rem] bg-[#2fabab]/10 flex items-center justify-center flex-shrink-0">
                                <User className="w-6 h-6 text-[#2fabab]" />
                              </div>
                              <div className="flex-1">
                                <p className="text-lg sm:text-xl font-black text-slate-900 tracking-tighter">{c['Aluno']}</p>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#2fabab] bg-[#2fabab]/10 px-2 py-0.5 rounded-full">{c['Perfil']}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-black text-[#2fabab]">{progressoValido ? `${progresso}%` : '—'}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso</p>
                              </div>
                            </div>

                            {/* Barra de progresso */}
                            {progressoValido && (
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-6">
                                <div className="h-full bg-gradient-to-r from-[#2fabab] to-[#c23c8e] rounded-full" style={{ width: `${Math.max(progresso, 2)}%` }} />
                              </div>
                            )}

                            {/* Métricas */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                              <div className="bg-slate-50 rounded-[1rem] p-3 text-center">
                                <p className="text-xl font-black text-slate-900">{c['Total de cursos']}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                              </div>
                              <div className="bg-green-50 rounded-[1rem] p-3 text-center">
                                <p className="text-xl font-black text-green-600">{c['Concluídos'] === '-----' ? '0' : c['Concluídos']}</p>
                                <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">Concluídos</p>
                              </div>
                              <div className="bg-blue-50 rounded-[1rem] p-3 text-center">
                                <p className="text-xl font-black text-blue-600">{c['Em andamento'] === '-----' ? '0' : c['Em andamento']}</p>
                                <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Em Andamento</p>
                              </div>
                              <div className="bg-orange-50 rounded-[1rem] p-3 text-center">
                                <p className="text-xl font-black text-[#f08228]">{c['A fazer'] === '-----' ? '0' : c['A fazer']}</p>
                                <p className="text-[9px] font-black text-orange-300 uppercase tracking-widest">A Fazer</p>
                              </div>
                            </div>

                            {/* Último curso concluído */}
                            {c['Último curso concluído'] && c['Último curso concluído'] !== '-----' && (
                              <div className="flex items-center gap-3 bg-[#2fabab]/5 border border-[#2fabab]/15 rounded-[1rem] px-4 py-3">
                                <TrendingUp className="w-4 h-4 text-[#2fabab] flex-shrink-0" />
                                <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Último Curso Concluído</p>
                                  <p className="text-slate-700 font-bold text-sm mt-0.5">{c['Último curso concluído']}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : unidadeSelecionada && !colaboradoresLoading ? (
                <div className="flex flex-col items-center justify-center py-48 bg-slate-50/40 rounded-[5rem] border-4 border-dashed border-slate-100">
                  <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center mb-12 shadow-2xl shadow-slate-200 transform -rotate-6">
                    <Info className="w-12 h-12 text-[#2fabab]" />
                  </div>
                  <h3 className="text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Sem Dados</h3>
                  <p className="text-slate-400 text-center font-bold text-xl max-w-md uppercase tracking-tight leading-relaxed">
                    Nenhum colaborador encontrado para esta unidade.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-48 opacity-20 select-none grayscale hover:grayscale-0 transition-all duration-1000">
                  <div className="relative mb-14">
                    <Building className="w-48 h-48 text-slate-200" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#2fabab] to-[#c23c8e] mix-blend-overlay"></div>
                  </div>
                  <p className="text-slate-400 font-black tracking-[0.6em] uppercase text-sm">Selecione uma unidade</p>
                </div>
              )}
            </section>
          </>
        ) : searchMode === 'treinamentos' ? (
          <>
            <div className="mb-16">
              <form onSubmit={handleTreinamentoSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-12 flex items-center pointer-events-none z-10">
                  {treinamentoLoadingSuggestions ? (
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-[#f08228] animate-spin" />
                  ) : (
                    <Search className={`h-6 w-6 sm:h-8 sm:w-8 ${treinamentoQuery ? 'text-[#f08228]' : 'text-slate-200'} transition-colors duration-500`} />
                  )}
                </div>
                <input
                  type="text"
                  value={treinamentoQuery}
                  onChange={handleTreinamentoInputChange}
                  onFocus={() => treinamentoSuggestions.length > 0 && setShowTreinamentoSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTreinamentoSuggestions(false), 150)}
                  placeholder="Digite o nome do colaborador..."
                  className="block w-full pl-20 sm:pl-28 pr-32 sm:pr-48 py-6 sm:py-10 bg-slate-50 border-[3px] border-slate-50 rounded-[2.5rem] sm:rounded-[3.5rem] text-slate-900 focus:outline-none focus:border-[#f08228] focus:ring-4 sm:focus:ring-8 focus:ring-[#f08228]/10 focus:bg-white transition-all text-lg sm:text-4xl font-black shadow-inner placeholder:text-slate-200"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 sm:pr-10 gap-2 sm:gap-5">
                  {treinamentoQuery && (
                    <button type="button" onClick={handleTreinamentoClear} className="p-2 sm:p-4 text-slate-300 hover:text-slate-600 transition-colors">
                      <X className="h-6 w-6 sm:h-9 sm:w-9" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-[#f08228] hover:bg-[#d06e20] shadow-2xl shadow-[#f08228]/30 text-white font-black py-3 px-6 sm:py-6 sm:px-14 rounded-[2rem] sm:rounded-[2.5rem] transition-all active:scale-95 text-sm sm:text-base tracking-[0.2em] uppercase italic"
                  >
                    Localizar
                  </button>
                </div>

                {/* AUTOCOMPLETE SUGESTÕES — treinamentos */}
                {showTreinamentoSuggestions && treinamentoSuggestions.length > 0 && (
                  <div ref={treinamentoSuggestionsRef} className="absolute z-30 w-full mt-6 bg-white/98 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.18)] border border-white overflow-hidden">
                    <div className="p-7 border-b border-slate-50 bg-slate-50/40">
                      <span className="text-[10px] font-black text-[#f08228] uppercase tracking-[0.5em]">Selecione o Colaborador</span>
                    </div>
                    {treinamentoSuggestions.map((nome, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => handleSelectSuggestion(nome)}
                        className="w-full text-left px-12 py-7 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-[#f08228]/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-5 h-5 text-[#f08228]" />
                          </div>
                          <span className="text-slate-700 font-bold text-xl sm:text-2xl tracking-tighter">{nome}</span>
                        </div>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-[#f08228]/10 text-[#f08228] group-hover:translate-x-2">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* RESULTS — treinamentos */}
            <section className="flex-grow pb-24">
              {treinamentoSearched && treinamentoResult ? (
                <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
                  {/* Cabeçalho do card */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-100 overflow-hidden">
                    {/* Faixa superior */}
                    <div className="h-3 bg-gradient-to-r from-[#f08228] via-[#c23c8e] to-[#f08228]" />

                    <div className="p-8 sm:p-12">
                      {/* Identidade do usuário */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.5rem] bg-gradient-to-br from-[#f08228]/20 to-[#c23c8e]/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-8 h-8 sm:w-10 sm:h-10 text-[#f08228]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">{treinamentoResult['Usuário']}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="text-xs font-black uppercase tracking-widest text-[#f08228] bg-[#f08228]/10 px-3 py-1 rounded-full">{treinamentoResult['Perfil']}</span>
                            <span className="text-sm text-slate-400 font-medium">{treinamentoResult['E-mail']}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unidades */}
                      <div className="mb-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3">Unidades Relacionadas</p>
                        <div className="flex flex-wrap gap-2">
                          {treinamentoResult['Unidade Relacionadas ao Usuário'].map((u, i) => (
                            <span key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm px-4 py-2 rounded-2xl">
                              <MapPin className="w-3.5 h-3.5 text-[#f08228]" />
                              {u}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      {(() => {
                        const total = Number(treinamentoResult['Total de Cursos']) || 0;
                        const concluidos = Number(treinamentoResult['Concluídos']) || 0;
                        const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;
                        return (
                          <div className="mb-10">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Progresso Geral</p>
                              <span className="text-2xl font-black text-[#f08228]">{progresso}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#f08228] to-[#c23c8e] rounded-full transition-all duration-1000"
                                style={{ width: `${Math.max(progresso, progresso > 0 ? 2 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Métricas de cursos */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
                        <div className="bg-slate-50 rounded-[1.5rem] p-5 flex flex-col items-center gap-2">
                          <BookOpen className="w-6 h-6 text-slate-400" />
                          <span className="text-3xl font-black text-slate-900">{treinamentoResult['Total de Cursos']}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Total</span>
                        </div>
                        <div className="bg-green-50 rounded-[1.5rem] p-5 flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                          <span className="text-3xl font-black text-green-600">{treinamentoResult['Concluídos']}</span>
                          <span className="text-[10px] font-black text-green-400 uppercase tracking-widest text-center">Concluídos</span>
                        </div>
                        <div className="bg-blue-50 rounded-[1.5rem] p-5 flex flex-col items-center gap-2">
                          <PlayCircle className="w-6 h-6 text-blue-500" />
                          <span className="text-3xl font-black text-blue-600">{treinamentoResult['Em Andamento']}</span>
                          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">Em Andamento</span>
                        </div>
                        <div className="bg-orange-50 rounded-[1.5rem] p-5 flex flex-col items-center gap-2">
                          <Clock className="w-6 h-6 text-[#f08228]" />
                          <span className="text-3xl font-black text-[#f08228]">{treinamentoResult['Não Iniciados']}</span>
                          <span className="text-[10px] font-black text-orange-300 uppercase tracking-widest text-center">Não Iniciados</span>
                        </div>
                      </div>

                      {/* Último curso concluído */}
                      {treinamentoResult['Última Curso Concluído'] && (
                        <div className="flex items-center gap-4 bg-gradient-to-r from-[#f08228]/5 to-[#c23c8e]/5 border border-[#f08228]/20 rounded-[1.5rem] px-6 py-4">
                          <TrendingUp className="w-5 h-5 text-[#f08228] flex-shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Último Curso Concluído</p>
                            <p className="text-slate-700 font-bold text-base mt-0.5">{treinamentoResult['Última Curso Concluído']}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : treinamentoSearched ? (
                <div className="flex flex-col items-center justify-center py-48 bg-slate-50/40 rounded-[5rem] border-4 border-dashed border-slate-100">
                  <div className={`w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center mb-12 shadow-2xl shadow-slate-200 transform -rotate-6`}>
                    <Info className={`w-12 h-12 ${treinamentoMensagem ? 'text-[#c23c8e]' : 'text-[#f08228]'}`} />
                  </div>
                  <h3 className="text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter">
                    {treinamentoMensagem ? 'Sem Treinamentos' : 'Não Encontrado'}
                  </h3>
                  <p className="text-slate-400 text-center font-bold text-xl max-w-lg uppercase tracking-tight leading-relaxed">
                    {treinamentoMensagem ?? 'Nenhum colaborador localizado com esse nome.'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-48 opacity-20 select-none grayscale hover:grayscale-0 transition-all duration-1000">
                  <div className="relative mb-14">
                    <GraduationCap className="w-48 h-48 text-slate-200" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#f08228] to-[#c23c8e] mix-blend-overlay"></div>
                  </div>
                  <p className="text-slate-400 font-black tracking-[0.6em] uppercase text-sm">Digite o nome do colaborador</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            {/* SEARCH BOX — modo unidade/consultor */}
            <div className="mb-16">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-12 flex items-center pointer-events-none z-10">
                  {loading ? (
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-[#2fabab] animate-spin" />
                  ) : (
                    <Search className={`h-6 w-6 sm:h-8 sm:w-8 ${query ? (searchMode === 'unidade' ? 'text-[#2fabab]' : 'text-[#c23c8e]') : 'text-slate-200'} transition-colors duration-500`} />
                  )}
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder={searchMode === 'unidade' ? "Unidade ou Código..." : "Nome do Consultor..."}
                  className={`block w-full pl-20 sm:pl-28 pr-32 sm:pr-48 py-6 sm:py-10 bg-slate-50 border-[3px] border-slate-50 rounded-[2.5rem] sm:rounded-[3.5rem] text-slate-900 focus:outline-none ${searchMode === 'unidade' ? 'focus:border-[#2fabab] focus:ring-4 sm:focus:ring-8 focus:ring-[#2fabab]/10' : 'focus:border-[#c23c8e] focus:ring-4 sm:focus:ring-8 focus:ring-[#c23c8e]/10'} focus:bg-white transition-all text-lg sm:text-4xl font-black shadow-inner placeholder:text-slate-200`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 sm:pr-10 gap-2 sm:gap-5">
                  {query && (
                    <button type="button" onClick={handleClear} className="p-2 sm:p-4 text-slate-300 hover:text-slate-600 transition-colors">
                      <X className="h-6 w-6 sm:h-9 sm:w-9" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`${searchMode === 'unidade' ? 'bg-[#2fabab] hover:bg-[#258a8a] shadow-2xl shadow-[#2fabab]/30' : 'bg-[#c23c8e] hover:bg-[#a63279] shadow-2xl shadow-[#c23c8e]/30'} text-white font-black py-3 px-6 sm:py-6 sm:px-14 rounded-[2rem] sm:rounded-[2.5rem] transition-all active:scale-95 disabled:opacity-50 text-sm sm:text-base tracking-[0.2em] uppercase italic`}
                  >
                    Localizar
                  </button>
                </div>

                {/* AUTOCOMPLETE SUGGESTIONS */}
                {showSuggestions && suggestions.length > 0 && (
                  <div ref={suggestionsRef} className="absolute z-30 w-full mt-6 bg-white/98 backdrop-blur-2xl rounded-[3rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.18)] border border-white overflow-hidden animate-in fade-in slide-in-from-top-6 duration-700">
                    <div className="p-7 border-b border-slate-50 bg-slate-50/40">
                      <span className="text-[10px] font-black text-[#f08228] uppercase tracking-[0.5em]">Busca Sugerida</span>
                    </div>
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => { setQuery(s); setSubmittedQuery(s); setShowSuggestions(false); }}
                        className="w-full text-left px-12 py-8 hover:bg-slate-50 flex items-center justify-between group transition-colors"
                      >
                        <span className="text-slate-700 font-bold text-3xl tracking-tighter">{s}</span>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all ${searchMode === 'unidade' ? 'bg-[#2fabab]/10 text-[#2fabab]' : 'bg-[#c23c8e]/10 text-[#c23c8e]'} group-hover:translate-x-3`}>
                          <ChevronRight className="w-8 h-8" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* RESULTS FEED */}
            <section className="flex-grow pb-24">
              {error && (
                <div className="mb-14 p-10 bg-red-50 border-l-8 border-red-500 rounded-3xl flex items-center gap-8 text-red-700 shadow-xl">
                  <AlertCircle className="w-10 h-10 flex-shrink-0" />
                  <p className="font-black uppercase tracking-tight text-xl">{error}</p>
                </div>
              )}

              {submittedQuery ? (
                results.length > 0 ? (
                  <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <div className="flex items-center gap-8 mb-14 border-b border-slate-100 pb-12">
                      <div className={`w-4 h-4 rounded-full ${searchMode === 'unidade' ? 'bg-[#2fabab]' : 'bg-[#c23c8e]'} animate-pulse shadow-[0_0_15px_rgba(47,171,171,0.5)]`}></div>
                      <h3 className="text-slate-900 font-black text-4xl tracking-tighter uppercase">
                        Resultados para: <span className={searchMode === 'unidade' ? 'text-[#2fabab]' : 'text-[#c23c8e]'}>"{submittedQuery}"</span>
                        <span className="ml-6 text-slate-300 font-medium opacity-50">/ {results.length} unidades</span>
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {results.map((u) => (
                        <UnitCard key={u.id} unit={u} searchTerm={submittedQuery} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-48 bg-slate-50/40 rounded-[5rem] border-4 border-dashed border-slate-100">
                    <div className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center mb-12 shadow-2xl shadow-slate-200 transform -rotate-6">
                      <Info className="w-12 h-12 text-[#f08228]" />
                    </div>
                    <h3 className="text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Vazio Absoluto</h3>
                    <p className="text-slate-400 text-center font-bold text-xl max-w-md uppercase tracking-tight leading-relaxed">
                      Não localizamos dados para o termo informado. Tente buscar por <span className="text-[#c23c8e]">consultor</span> ou outro código.
                    </p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-48 opacity-20 select-none grayscale hover:grayscale-0 transition-all duration-1000">
                  <div className="relative mb-14">
                    <Search className="w-48 h-48 text-slate-200" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#2fabab] to-[#f08228] mix-blend-overlay"></div>
                  </div>
                  <p className="text-slate-400 font-black tracking-[0.6em] uppercase text-sm">Pronto para a Próxima Consulta</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
