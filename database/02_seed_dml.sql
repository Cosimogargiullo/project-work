-- DML seed iniziale per CareHub (schema carehub)
SET
  search_path TO carehub;

-- Users
INSERT INTO
  carehub.users (
    username,
    email,
    password_hash,
    first_name,
    last_name,
    fiscal_code,
    birth_date,
    phone,
    specialization
  )
VALUES
  (
    'admin',
    'admin@carehublocal.it',
    '$2a$10$qeL2x1J0lmblBICG9V2oOuQOGZNz84MOkxBqgINVFUv8XDcymSimS',
    'Admin',
    'Root',
    'ADMNRT90A01H501A',
    '1990-01-01',
    '3205550001',
    NULL
  ),
  (
    'seg01',
    'seg01@carehublocal.it',
    '$2a$10$qeL2x1J0lmblBICG9V2oOuQOGZNz84MOkxBqgINVFUv8XDcymSimS',
    'Lucia',
    'Segretaria',
    'SEGLCU91B02H501B',
    '1991-02-02',
    '3205550002',
    NULL
  ),
  (
    'seg02',
    'seg02@carehublocal.it',
    '$2a$10$qeL2x1J0lmblBICG9V2oOuQOGZNz84MOkxBqgINVFUv8XDcymSimS',
    'Francesca',
    'Segretaria',
    'SEGFNC92C03H501C',
    '1992-03-03',
    '3205550003',
    NULL
  ),
  (
    'seg03',
    'seg03@carehublocal.it',
    '$2a$10$qeL2x1J0lmblBICG9V2oOuQOGZNz84MOkxBqgINVFUv8XDcymSimS',
    'Anna',
    'Segretaria',
    'SEGANN93D04H501D',
    '1993-04-04',
    '3205550004',
    NULL
  ),
  (
    'dr.house',
    'house@carehublocal.it',
    '$2a$10$qeL2x1J0lmblBICG9V2oOuQOGZNz84MOkxBqgINVFUv8XDcymSimS',
    'Gregory',
    'House',
    'HSEGRY79E05H501E',
    '1979-05-05',
    '3205550005',
    'CARDIOLOGIA'
  ),
  (
    'dr.ortho',
    'ortho@carehublocal.it',
    '$2a$10$qeL2x1J0lmblBICG9V2oOuQOGZNz84MOkxBqgINVFUv8XDcymSimS',
    'Luca',
    'Ferrari',
    'FERLCU84F06H501F',
    '1984-06-06',
    '3205550006',
    'ORTOPEDIA'
  ),
  (
    'dr.derma',
    'derma@carehublocal.it',
    '$2a$10$qeL2x1J0lmblBICG9V2oOuQOGZNz84MOkxBqgINVFUv8XDcymSimS',
    'Laura',
    'Bianchi',
    'BNCLRA86G07H501G',
    '1986-07-07',
    '3205550007',
    'DERMATOLOGIA'
  ),
  (
    'pat001',
    'pat001@carehublocal.it',
    '$2a$10$qeL2x1J0lmblBICG9V2oOuQOGZNz84MOkxBqgINVFUv8XDcymSimS',
    'Mario',
    'Rossi',
    'PATMRA80A01H501U',
    '1980-01-01',
    '3205550008',
    NULL
  ),
  (
    'pat002',
    'pat002@carehublocal.it',
    '$2a$10$qeL2x1J0lmblBICG9V2oOuQOGZNz84MOkxBqgINVFUv8XDcymSimS',
    'Giulia',
    'Verdi',
    'PATGLI85C41F205X',
    '1985-03-01',
    '3205550009',
    NULL
  ),
  (
    'pat003',
    'pat003@carehublocal.it',
    '$2a$10$qeL2x1J0lmblBICG9V2oOuQOGZNz84MOkxBqgINVFUv8XDcymSimS',
    'Paolo',
    'Neri',
    'PATPLA90D10H501Y',
    '1990-04-10',
    '3205550010',
    NULL
  );

INSERT INTO
  user_roles (user_id, role)
VALUES
  (1, 'ADMIN'),
  (2, 'SEGRETERIA'),
  (3, 'SEGRETERIA'),
  (4, 'SEGRETERIA'),
  (5, 'MEDICO'),
  (6, 'MEDICO'),
  (7, 'MEDICO'),
  (8, 'PAZIENTE'),
  (9, 'PAZIENTE'),
  (10, 'PAZIENTE');