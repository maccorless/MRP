-- Migration 0022: add ino and if_staff to org_type enum
-- ino      = International Non-Governmental Organisation (IOC-Direct workflow)
-- if_staff = IF staff journalists/photographers (IOC-Direct workflow with IF-Staff flag)

ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'ino';
ALTER TYPE "org_type" ADD VALUE IF NOT EXISTS 'if_staff';
