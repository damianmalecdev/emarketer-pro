-- Supabase data backup (partial, secrets omitted)
-- Project: https://fflfuihfpdrvrukusnud.supabase.co
-- Date: 2025-10-29

BEGIN;

-- Table: public.User
INSERT INTO "public"."User" ("id","email","emailVerified","name","image","createdAt","updatedAt") VALUES
('ddfd0ed3-0ae3-40e5-8487-02923067c94f','test@example.com',NULL,'Test User',NULL,'2025-10-23 09:42:17.212','2025-10-23 09:42:17.212');

-- Table: public.Company
INSERT INTO "public"."Company" ("id","name","domain","createdAt","updatedAt") VALUES
('34f24c2a-d0b4-4eb9-8c4f-0746f62aeeed','Test Company',NULL,'2025-10-23 09:42:21.544','2025-10-23 09:42:21.544'),
('ae474e0a-6538-4b32-af0c-ccd788e2abdc','Nowy',NULL,'2025-10-23 12:13:53.567','2025-10-23 12:13:53.567'),
('f45ec7fd-9a4c-4751-9775-66d841d1f98b','Test',NULL,'2025-10-29 18:39:25.238','2025-10-29 18:39:25.238');

-- Table: public.Membership
INSERT INTO "public"."Membership" ("id","userId","companyId","role","createdAt","updatedAt") VALUES
('2b4c985b-d855-4630-b4cd-588876bd0602','3d5b5327-07ff-4e2a-af2c-4b9caa8139cf','f45ec7fd-9a4c-4751-9775-66d841d1f98b','owner','2025-10-29 18:39:25.284','2025-10-29 18:39:25.286'),
('550e8400-e29b-41d4-a716-446655440000','132ebb21-b332-4eb9-b6c2-75e83dbbb31d','34f24c2a-d0b4-4eb9-8c4f-0746f62aeeed','owner','2025-10-23 11:54:00.895','2025-10-23 11:54:00.895'),
('ab8caf5b-012a-41b6-9db1-9d95ddbd5164','132ebb21-b332-4eb9-b6c2-75e83dbbb31d','ae474e0a-6538-4b32-af0c-ccd788e2abdc','owner','2025-10-23 12:13:53.642','2025-10-23 12:13:53.578'),
('test-membership-1','ddfd0ed3-0ae3-40e5-8487-02923067c94f','34f24c2a-d0b4-4eb9-8c4f-0746f62aeeed','admin','2025-10-23 09:42:26.203','2025-10-23 09:42:26.203');

-- Table: public.Integration (access/refresh tokens omitted)
INSERT INTO "public"."Integration" ("id","companyId","platform","accountId","expiresAt","isActive","createdAt","updatedAt","accountName") VALUES
('meta-test-1','34f24c2a-d0b4-4eb9-8c4f-0746f62aeeed','meta','test_account_123',NULL,true,'2025-10-23 14:33:49.226','2025-10-23 14:33:49.226','Test Meta Account'),
('test-integration-1','34f24c2a-d0b4-4eb9-8c4f-0746f62aeeed','google-ads','test-account-123',NULL,true,'2025-10-23 13:21:53.857','2025-10-23 13:21:53.857','Test Google Ads Account');

-- Table: public.GoogleAdsSyncLog
INSERT INTO "public"."GoogleAdsSyncLog" ("id","customerId","syncType","entityType","status","startedAt","completedAt","duration","recordsProcessed","recordsCreated","recordsUpdated","error","errorDetails","triggeredBy","createdAt","updatedAt") VALUES
('cmh3gi4l70000gojdo6of6jwc','test-customer-123','FULL','CAMPAIGNS','SUCCESS','2025-10-23 13:27:07.585','2025-10-23 13:27:08.14',0,0,0,0,NULL,NULL,'MCP','2025-10-23 13:27:07.963','2025-10-23 13:27:08.141'),
('cmh3gij5x0001gojd58bx9d11','test-account-123','FULL','CAMPAIGNS','SUCCESS','2025-10-23 13:27:26.817','2025-10-23 13:27:27.029',0,0,0,0,NULL,NULL,'MCP','2025-10-23 13:27:26.818','2025-10-23 13:27:27.03'),
('cmh3h6eid0000go6cmq43hpf9','test-customer-123','FULL','CAMPAIGNS','SUCCESS','2025-10-23 13:46:00.186','2025-10-23 13:46:00.807',0,0,0,0,NULL,NULL,'MCP','2025-10-23 13:46:00.565','2025-10-23 13:46:00.808');

COMMIT;
