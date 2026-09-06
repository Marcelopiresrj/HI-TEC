import { AdminAccount, AdminSession, StoreSettings } from '../types';

const ADMIN_STORAGE_KEY = 'hitech_admin_accounts';
const SESSION_STORAGE_KEY = 'hitech_admin_session';
const STORE_SETTINGS_KEY = 'hitech_store_settings';

// Hash helper using browser Web Crypto API
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function getAdminAccounts(): AdminAccount[] {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading admin accounts:', e);
    return [];
  }
}

export function hasAnyAdmin(): boolean {
  return getAdminAccounts().length > 0;
}

export async function registerAdmin(params: {
  name: string;
  email: string;
  password: string;
  securityKey: string;
  masterSecurityKeyCheck?: string;
}): Promise<{ success: boolean; error?: string; session?: AdminSession }> {
  const { name, email, password, securityKey, masterSecurityKeyCheck } = params;

  if (!name.trim() || !email.trim() || !password || !securityKey.trim()) {
    return { success: false, error: 'Todos os campos são obrigatórios.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
  }

  const accounts = getAdminAccounts();
  const normalizedEmail = email.trim().toLowerCase();

  // If accounts already exist, check if email is already taken
  if (accounts.some((acc) => acc.email.toLowerCase() === normalizedEmail)) {
    return { success: false, error: 'Já existe um administrador cadastrado com este e-mail.' };
  }

  // If there are already admin accounts, require the master security key
  if (accounts.length > 0) {
    const masterAccount = accounts.find((acc) => acc.role === 'master') || accounts[0];
    if (!masterSecurityKeyCheck) {
      return {
        success: false,
        error: 'Para cadastrar um novo administrador, insira a Chave Master de Segurança da loja.',
      };
    }
    const checkHash = await hashString(masterSecurityKeyCheck);
    if (checkHash !== masterAccount.securityKeyHash) {
      return { success: false, error: 'Chave Master de Segurança incorreta.' };
    }
  }

  const passwordHash = await hashString(password);
  const securityKeyHash = await hashString(securityKey);

  const newAccount: AdminAccount = {
    id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    securityKeyHash,
    role: accounts.length === 0 ? 'master' : 'admin',
    createdAt: new Date().toISOString(),
  };

  const updatedAccounts = [...accounts, newAccount];
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(updatedAccounts));

  const session: AdminSession = {
    user: {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
    },
    loginTime: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return { success: true, session };
}

export async function loginAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; session?: AdminSession }> {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getAdminAccounts();

  const account = accounts.find((acc) => acc.email.toLowerCase() === normalizedEmail);
  if (!account) {
    return { success: false, error: 'Nenhum administrador encontrado com este e-mail.' };
  }

  const inputHash = await hashString(password);
  if (inputHash !== account.passwordHash) {
    return { success: false, error: 'Senha incorreta. Tente novamente.' };
  }

  const session: AdminSession = {
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
    },
    loginTime: new Date().toISOString(),
  };

  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return { success: true, session };
}

export function getCurrentSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logoutAdmin(): void {
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

export async function recoverPassword(
  email: string,
  securityKey: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const accounts = getAdminAccounts();

  const index = accounts.findIndex((acc) => acc.email.toLowerCase() === normalizedEmail);
  if (index === -1) {
    return { success: false, error: 'E-mail não encontrado.' };
  }

  const keyHash = await hashString(securityKey);
  if (keyHash !== accounts[index].securityKeyHash) {
    return { success: false, error: 'Chave de Segurança incorreta.' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
  }

  accounts[index].passwordHash = await hashString(newPassword);
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(accounts));
  return { success: true };
}

// Default Store Configuration
export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Hi-Tech Eletrônicos',
  storeHandle: '@hitecheletronicos',
  specialtyTitle: 'Montagem e Manutenção de Celulares e Tablets • Venda de Games e Acessórios',
  servicesDescription: 'Troca de Telas, Touch, Conectores, Microfone, Baterias, Câmeras e Alto-falantes',
  whatsappNumber: '5522998706841',
  whatsappDisplay: '(22) 99870-6841',
  whatsappDefaultMsg: 'Olá! Gostaria de um orçamento para montagem/manutenção de celular/tablet.',
  instagramUrl: 'https://www.instagram.com/hitecheletronicos/',
  googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJpQHbaLq0lwARw4-9Eg-uzbY',
  address: 'Av. Jane Maria Martins Figueira, 12 - Jardim Marileia, Rio das Ostras - RJ, 28896-052',
  hoursWeekday: 'Segunda a Sexta: 09:00 às 18:30',
  hoursSaturday: 'Sábado: 09:00 às 14:30',
  hoursSunday: 'Domingo: Fechado',
  holidayNote: 'Em feriados os horários podem sofrer alterações',
  pixKey: '22998706841',
  pixReceiver: 'Hi-Tech Eletrônicos',
};

export function getStoreSettings(): StoreSettings {
  try {
    const raw = localStorage.getItem(STORE_SETTINGS_KEY);
    if (!raw) return DEFAULT_STORE_SETTINGS;
    const parsed = JSON.parse(raw);
    
    // Auto-migrate previous default address and Saturday hours if outdated
    if (parsed.address && (parsed.address.includes('Valdir Silva') || parsed.address.includes('Macaé'))) {
      parsed.address = DEFAULT_STORE_SETTINGS.address;
    }
    if (parsed.hoursSaturday && parsed.hoursSaturday.includes('13:00')) {
      parsed.hoursSaturday = DEFAULT_STORE_SETTINGS.hoursSaturday;
    }
    if (!parsed.hoursSunday) {
      parsed.hoursSunday = DEFAULT_STORE_SETTINGS.hoursSunday;
    }
    if (!parsed.holidayNote) {
      parsed.holidayNote = DEFAULT_STORE_SETTINGS.holidayNote;
    }
    if (parsed.specialtyTitle === 'Montagem e Manutenção de Celulares e Tablets') {
      parsed.specialtyTitle = DEFAULT_STORE_SETTINGS.specialtyTitle;
    }

    return { ...DEFAULT_STORE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export function saveStoreSettings(settings: StoreSettings): void {
  localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(settings));
}
