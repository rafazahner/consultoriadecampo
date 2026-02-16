
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Building, Info, Loader2, AlertCircle, ChevronRight, UserSearch, Target } from 'lucide-react';
import { Unit, MovideskPerson } from './types';
import { UnitCard } from './components/UnitCard';
import { containsSearchTerm } from './utils/searchUtils';

const API_BASE_URL = "https://api.movidesk.com/public/v1/persons?token=fb6ad8cd-1026-40b2-8224-f2a8dad2c97d";
const MASCOTE_URL = "https://i.postimg.cc/4y5Y9L0H/Gemini-Generated-Image-gdyamxgdyamxgdya-removebg-preview.png";
const LOGO_URL = "https://i.postimg.cc/HLySLdXq/Captura_de_tela_2026_01_27_163949.png";

const ID_CAMPO_CONSULTOR = 236742;
const ID_CAMPO_FRANQUIA = 236743;
const ID_CAMPO_FRANQUEADO = 236744;

const App: React.FC = () => {
  const [unidades, setUnidades] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'unidade' | 'consultor'>('unidade');

  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}&$filter=personType eq 2&$top=100`);
        if (!response.ok) throw new Error('Falha ao conectar com o Movidesk');

        const data: MovideskPerson[] = await response.json();

        const mappedUnits: Unit[] = data.map(person => {
          const getCustomValue = (id: number) => {
            return person.customFieldValues?.find(cf => cf.customFieldId === id)?.value || "N/A";
          };

          return {
            id: person.codeReferenceAdditional || person.id,
            unidade: (person.businessName || 'Sem Nome').trim(),
            cidade: (person.addresses?.[0]?.city || 'Não informada').trim(),
            franquia: getCustomValue(ID_CAMPO_FRANQUIA).trim(),
            franqueado: getCustomValue(ID_CAMPO_FRANQUEADO).trim(),
            consultorCampo: getCustomValue(ID_CAMPO_CONSULTOR).trim()
          };
        });

        const uniqueUnits = mappedUnits.filter((unit, index, self) =>
          index === self.findIndex((u) => (
            u.id === unit.id || u.unidade === unit.unidade
          ))
        );

        setUnidades(uniqueUnits);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Erro ao carregar dados do Movidesk.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
  };

  return (
    <div className="min-h-screen bg-white lg:flex">
      {/* SIDEBAR: Pantone Themed Branding */}
      <aside className="lg:w-[480px] xl:w-[580px] bg-gradient-to-br from-[#2fabab]/5 via-[#c23c8e]/5 to-[#f08228]/5 border-r border-slate-100 relative lg:h-screen lg:sticky lg:top-0 flex flex-col items-center justify-center p-8 overflow-hidden">
        {/* Glow Effects using exact Pantone palette */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#2fabab]/15 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#f08228]/15 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#c23c8e]/10 rounded-full blur-[80px]"></div>

        <div className="relative z-10 w-full max-w-[440px] animate-float">
          <img
            src={MASCOTE_URL}
            alt="Personagem Ultra"
            className="w-full h-auto drop-shadow-[0_45px_45px_rgba(47,171,171,0.3)] transition-transform hover:scale-105 duration-1000"
          />
        </div>


      </aside>

      {/* MAIN: Search Engine */}
      <main className="flex-1 min-h-screen flex flex-col p-4 sm:p-8 lg:p-12 xl:p-24">
        {/* Header content skipped for brevity... */}
        <header className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center gap-8 mb-14">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <img
                  src={LOGO_URL}
                  alt="Ultra Academia"
                  className="h-28 w-auto object-contain transform group-hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            <div className="flex p-1.5 bg-slate-100/80 backdrop-blur-sm rounded-[1.6rem] w-fit sm:ml-auto border border-slate-200 shadow-inner">
              <button
                onClick={() => { setSearchMode('unidade'); handleClear(); }}
                className={`flex items-center gap-2.5 px-8 py-4 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all duration-300 ${searchMode === 'unidade' ? 'bg-white text-[#2fabab] shadow-xl shadow-[#2fabab]/15 border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Building className="w-4.5 h-4.5" />
                Unidades
              </button>
              <button
                onClick={() => { setSearchMode('consultor'); handleClear(); }}
                className={`flex items-center gap-2.5 px-8 py-4 rounded-[1.2rem] text-xs font-black uppercase tracking-widest transition-all duration-300 ${searchMode === 'consultor' ? 'bg-white text-[#c23c8e] shadow-xl shadow-[#c23c8e]/15 border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <UserSearch className="w-4.5 h-4.5" />
                Consultores
              </button>
            </div>
          </div>

          <div className="relative group">
            <h2 className="text-6xl sm:text-7xl xl:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85] uppercase mb-4">
              Pesquisa <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2fabab] via-[#c23c8e] to-[#f08228]">Consultoria de Campo</span>
            </h2>
            <div className="h-2.5 w-56 bg-gradient-to-r from-[#2fabab] via-[#c23c8e] to-[#f08228] rounded-full mt-8 group-hover:w-full transition-all duration-1000"></div>
          </div>
        </header>

        {/* SEARCH BOX */}
        <div className="mb-16">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-12 flex items-center pointer-events-none z-10">
              {loading ? (
                <Loader2 className="h-8 w-8 text-[#2fabab] animate-spin" />
              ) : (
                <Search className={`h-8 w-8 ${query ? (searchMode === 'unidade' ? 'text-[#2fabab]' : 'text-[#c23c8e]') : 'text-slate-200'} transition-colors duration-500`} />
              )}
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder={searchMode === 'unidade' ? "Unidade ou Código..." : "Nome do Consultor..."}
              className={`block w-full pl-28 pr-48 py-10 bg-slate-50 border-[3px] border-slate-50 rounded-[3.5rem] text-slate-900 focus:outline-none ${searchMode === 'unidade' ? 'focus:border-[#2fabab] focus:ring-8 focus:ring-[#2fabab]/10' : 'focus:border-[#c23c8e] focus:ring-8 focus:ring-[#c23c8e]/10'} focus:bg-white transition-all text-2xl sm:text-4xl font-black shadow-inner placeholder:text-slate-200`}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-10 gap-5">
              {query && (
                <button type="button" onClick={handleClear} className="p-4 text-slate-300 hover:text-slate-600 transition-colors">
                  <X className="h-9 w-9" />
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`${searchMode === 'unidade' ? 'bg-[#2fabab] hover:bg-[#258a8a] shadow-2xl shadow-[#2fabab]/30' : 'bg-[#c23c8e] hover:bg-[#a63279] shadow-2xl shadow-[#c23c8e]/30'} text-white font-black py-6 px-14 rounded-[2.5rem] transition-all active:scale-95 disabled:opacity-50 text-base tracking-[0.2em] uppercase italic`}
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
                <div className="grid grid-cols-1 gap-12">
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
      </main>
    </div>
  );
};

export default App;
