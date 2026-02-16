import React from 'react';
import { Unit } from '../types';
import { HighlightedText } from './HighlightedText';
import { MapPin, User, UserCheck, ShieldCheck, ChevronRight } from 'lucide-react';
import { normalizeText, capitalizeName } from '../utils/searchUtils';

interface UnitCardProps {
  unit: Unit;
  searchTerm: string;
}

const AVATAR_MARISE_URL = "https://i.postimg.cc/jjDn1Ygd/20260216_1827_Avatar_em_Uniforme_Ultra_remix_01khm5kc28fsptjm7511bcbec2_removebg_preview.png";
const AVATAR_GUILHERME_URL = "https://i.postimg.cc/cJvtzG9x/20260216_1833_Image_Generation_remix_01khm5w0jhfkes9ff8kfq27j9c_removebg_preview.png";
const AVATAR_JAILSON_URL = "https://i.postimg.cc/Gm7szmQ8/20260216_1834_Image_Generation_remix_01khm5zajafcf98vkxbw83a35c_removebg_preview.png";
const AVATAR_ANDERSON_URL = "https://i.postimg.cc/W4dqycWp/20260216_1836_Image_Generation_remix_01khm628nnf9f8k3kw8btx7d1s_removebg_preview.png";

export const UnitCard: React.FC<UnitCardProps> = ({ unit, searchTerm }) => {
  const isMarise =
    normalizeText(unit.unidade).includes('marise') ||
    normalizeText(unit.consultorCampo).includes('marise') ||
    normalizeText(unit.franqueado).includes('marise');

  const isGuilherme =
    normalizeText(unit.unidade).includes('guilherme') ||
    normalizeText(unit.consultorCampo).includes('guilherme') ||
    normalizeText(unit.franqueado).includes('guilherme');

  const isJailson =
    normalizeText(unit.unidade).includes('jailson') ||
    normalizeText(unit.consultorCampo).includes('jailson') ||
    normalizeText(unit.franqueado).includes('jailson');

  const isAnderson =
    normalizeText(unit.unidade).includes('anderson') ||
    normalizeText(unit.consultorCampo).includes('anderson') ||
    normalizeText(unit.franqueado).includes('anderson');

  let avatarUrl = null;
  let avatarName = "";
  let avatarStyles = "scale-100";
  let objectPos = "center top";
  let hoverScale = "group-hover:scale-[1.9]";

  if (isGuilherme) {
    avatarUrl = AVATAR_GUILHERME_URL;
    avatarName = "Guilherme";
    avatarStyles = "scale-[1.8] translate-y-12";
    objectPos = "center 5%";
    hoverScale = "group-hover:scale-[1.95]";
  } else if (isJailson) {
    avatarUrl = AVATAR_JAILSON_URL;
    avatarName = "Jailson";
    avatarStyles = "scale-[1.7] translate-y-10";
    objectPos = "center 10%";
    hoverScale = "group-hover:scale-[1.85]";
  } else if (isAnderson) {
    avatarUrl = AVATAR_ANDERSON_URL;
    avatarName = "Anderson";
    avatarStyles = "scale-[1.4] translate-y-4";
    objectPos = "center 15%";
    hoverScale = "group-hover:scale-[1.55]";
  } else if (isMarise) {
    avatarUrl = AVATAR_MARISE_URL;
    avatarName = "Marise";
    avatarStyles = "scale-[1.4] translate-y-4";
    objectPos = "center 5%";
    hoverScale = "group-hover:scale-[1.55]";
  }

  return (
    <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-slate-200 p-6 sm:p-12 hover:shadow-2xl hover:border-[#2fabab] transition-all duration-500 group relative overflow-hidden min-h-[auto] sm:min-h-[420px] flex flex-col justify-between">
      {/* Background decoration using Teal Pantone */}
      <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-[#2fabab]/5 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 transition-transform group-hover:scale-150 duration-700"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-start gap-4 sm:gap-5">
            {avatarUrl && (
              <div className="relative shrink-0 mt-2 overflow-hidden rounded-full w-20 h-20 sm:w-32 sm:h-32 border-4 sm:border-[6px] border-white shadow-2xl bg-slate-50">
                {/* Glow with Pantone Colors */}
                <div className={`absolute -inset-2 bg-gradient-to-tr ${isGuilherme || isJailson || isAnderson ? 'from-[#2fabab] to-[#c23c8e]' : 'from-[#c23c8e] to-[#f08228]'} rounded-full animate-pulse opacity-20 blur-sm`}></div>
                <img
                  src={avatarUrl}
                  alt={avatarName}
                  className={`w-full h-full object-cover relative z-10 transform transition-transform duration-500 ${avatarStyles} ${hoverScale}`}
                  style={{ objectPosition: objectPos }}
                />
              </div>
            )}
            <div className="flex flex-col gap-2 pt-1 sm:pt-2">
              <span className="text-[10px] sm:text-xs font-black text-[#2fabab] bg-[#2fabab]/10 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full uppercase tracking-widest self-start shadow-sm border border-[#2fabab]/20">
                Unidade Oficial
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-400">ID {unit.id}</span>
            </div>
          </div>
        </div>

        <h3 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#2fabab] mb-6 sm:mb-8 leading-none transition-colors tracking-tighter break-words">
          <HighlightedText
            text={unit.unidade}
            highlight={searchTerm}
          />
        </h3>

        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 px-4 py-2 sm:px-6 sm:py-2.5 bg-slate-50 text-slate-600 rounded-full text-sm sm:text-base font-bold border border-slate-100 shadow-sm">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#2fabab]" />
            {unit.cidade}
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-5 relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 pt-6 border-t border-slate-100">
          <div>
            <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-[0.15em] mb-2 sm:mb-3">Franquia</p>
            <div className="flex items-center gap-2 sm:gap-3">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#f08228]" />
              <p className="text-lg sm:text-2xl text-slate-700 font-bold">{unit.franquia}</p>
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-[0.15em] mb-2 sm:mb-3">Franqueado</p>
            <div className="flex items-center gap-2 sm:gap-3">
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#c23c8e]" />
              <p className="text-lg sm:text-2xl text-slate-700 font-bold truncate max-w-[180px] sm:max-w-[240px]" title={unit.franqueado}>
                {capitalizeName(unit.franqueado)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 transition-all group-hover:bg-[#2fabab]/5 group-hover:border-[#2fabab]/20 group-hover:shadow-inner">
          <p className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-[0.15em] mb-2 sm:mb-3">Consultor de Campo Responsável</p>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#2fabab]/10 flex items-center justify-center">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#2fabab]" />
            </div>
            <p className="text-xl sm:text-3xl text-slate-800 font-black tracking-tight group-hover:text-[#2fabab]">{capitalizeName(unit.consultorCampo)}</p>
          </div>
        </div>
      </div>


    </div>
  );
};