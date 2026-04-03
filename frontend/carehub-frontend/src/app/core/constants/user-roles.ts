export enum USER_ROLES {
  ADMIN = 'ADMIN',
  MEDICO = 'MEDICO',
  SEGRETERIA = 'SEGRETERIA',
  PAZIENTE = 'PAZIENTE'
}

export const ALL_USER_ROLES: string[] = Object.values(USER_ROLES);
