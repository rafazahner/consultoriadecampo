
export interface Unit {
  id: string;
  unidade: string;
  cidade: string;
  franquia: string;
  franqueado: string;
  consultorCampo: string;
}

export interface MovideskPerson {
  id: string;
  businessName: string;
  corporateName: string;
  // Fix: Added codeReferenceAdditional to interface to match Movidesk API response structure used in App.tsx
  codeReferenceAdditional?: string;
  addresses?: Array<{
    city?: string;
    district?: string;
  }>;
  customFieldValues?: Array<{
    customFieldId: number;
    value: string;
  }>;
}