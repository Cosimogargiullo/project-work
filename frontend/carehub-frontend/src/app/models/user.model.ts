export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  fiscalCode?: string;
  birthDate?: string; // ISO string, da formattare in view
  phone?: string;
  roles?: string[];
  specialization?: string; // nome leggibile, opzionale
  active?: boolean;

}

export interface RegisterUserPayload {
  username: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fiscalCode: string;
  birthDate?: string | Date | null;
  email?: string | null;
  phone?: string | null;
  password: string | null;
  roles: string[];
  specialization?: string | null;
}

export interface UpdateUserPayload {
  username?: string;
  firstName?: string;
  lastName?: string;
  fiscalCode?: string;
  birthDate?: string | null;
  email?: string;
  phone?: string;
  specialization?: string;
  roles?: string[];
}
