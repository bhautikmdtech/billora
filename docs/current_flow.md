Current State Analysis                                                                         
                                                                                                 
  What's solid (keep as-is):                                                                     
  - Database schema — well-designed, proper multi-tenancy, good indexes                          
  - Tech stack choices — Next.js App Router, Drizzle, Supabase, ShadCN, Zod                      
                                                                                                 
  What's messy (rebuild):                                                                        
                                                                                                 
  ┌─────────────────────┬──────────────────────────┬────────────────────────────────────────┐    
  │       Problem       │         Current          │                  Fix                   │    
  ├─────────────────────┼──────────────────────────┼────────────────────────────────────────┤  
  │ Duplicate routes    │ /app/app/[orgSlug] +     │ Single /w/[orgSlug]                    │
  │                     │ /workspace/[orgSlug]     │                                        │
  ├─────────────────────┼──────────────────────────┼────────────────────────────────────────┤    
  │ API routes vs       │                          │ Server Actions for mutations, API      │    
  │ Server Actions      │ Inconsistent             │ routes only for                        │    
  │ mixed randomly      │                          │ webhooks/callbacks/external            │    
  ├─────────────────────┼──────────────────────────┼────────────────────────────────────────┤  
  │ No feature-based    │ Everything flat in       │ Feature modules under /features/       │
  │ organization        │ /lib/, /components/      │                                        │    
  ├─────────────────────┼──────────────────────────┼────────────────────────────────────────┤
  │ No Super Admin role │ Email env var check only │ super_admin system flag on profiles    │    
  │  in DB              │                          │                                        │    
  ├─────────────────────┼──────────────────────────┼────────────────────────────────────────┤
  │ RBAC scattered      │ permissions.ts + inline  │ Centralized permission matrix          │    
  │                     │ checks                   │                                        │    
  └─────────────────────┴──────────────────────────┴────────────────────────────────────────┘
                                                                                                 
  ---                                                                                          
  Proposed Clean Architecture

  src/
  ├── app/
  │   ├── (marketing)/          ← public pages (landing, pricing)                                
  │   ├── (auth)/               ← login, register, forgot/reset, verify
  │   ├── (onboarding)/         ← org setup after register                                       
  │   ├── (workspace)/          ← all authenticated app routes                                 
  │   │   ├── w/                ← org selector                                                   
  │   │   └── w/[orgSlug]/                                                                     
  │   │       ├── (org)/        ← org-level pages (settings, members)                            
  │   │       └── [shopId]/     ← shop-level modules                                             
  │   ├── (superadmin)/                                                                          
  │   ├── api/                                                                                   
  │   │   ├── webhooks/         ← stripe, whatsapp                                               
  │   │   └── invites/[token]/  ← public invite API
  │   └── auth/callback/        ← supabase oauth (must be root)                                  
  │                                                                                            
  ├── features/                 ← all business logic lives here                                  
  │   ├── auth/                                                                                  
  │   │   ├── actions.ts        ← server actions (login, register, etc.)
  │   │   ├── schemas.ts        ← zod schemas                                                    
  │   │   └── queries.ts        ← db queries                                                     
  │   ├── orgs/
  │   ├── shops/                                                                                 
  │   ├── inventory/                                                                           
  │   ├── pos/
  │   ├── sales/                                                                                 
  │   ├── purchases/
  │   ├── customers/                                                                             
  │   ├── suppliers/                                                                           
  │   ├── expenses/
  │   ├── employees/
  │   └── reports/
  │
  ├── components/
  │   ├── ui/                   ← shadcn primitives only                                         
  │   ├── layout/               ← sidebar, header, nav-user
  │   └── shared/               ← cross-feature: theme, empty-state, etc.                        
  │                                                                                              
  ├── db/
  │   ├── schema.ts             ← (keep, minimal changes)                                        
  │   └── index.ts                                                                               
  │
  ├── lib/                                                                                       
  │   ├── supabase/                                                                            
  │   ├── auth.ts               ← session helpers
  │   ├── permissions.ts        ← RBAC matrix (source of truth)                                  
  │   ├── errors.ts
  │   └── utils.ts                                                                               
  │                                                                                            
  └── types/                                                                                     
                                                                                               
  ---
  Role Hierarchy
                                                                                                 
  super_admin         ← platform-level, full access (flag on profiles table)
    └── org_owner     ← owns the org, all shops                                                  
         └── partner  ← co-owner, all shops, no billing                                          
              └── admin (org)   ← org-level settings, can manage shops                           
                   └── shop_admin ← single shop ops                                              
                        └── employee   ← assigned shop only                                      
                             └── customer  ← self-service portal (future)                        
                                                                                                 
  ---                                                                                          
  Build Order                                                                                    
                                                                                               
  1. Foundation — folder restructure, clean up duplicates, establish patterns
  2. Auth — login, register, forgot/reset, verify email, role guards                             
  3. Invite flow — send email, accept, assign role                                               
  4. Org & Shop management — CRUD, settings                                                      
  5. Inventory — SKU auto-gen, barcode/QR, categories, variants                                  
  6. Purchases — POs, receive stock, purchase returns                                            
  7. POS / Sales — barcode scan, customer selection, WhatsApp bill                             
  8. Sales Return                                                                                
  9. Expenses                                                                                  
  10. Employees — attendance, salary, payroll                                                    
  11. Reports / Dashboard — role-based views                                                     
  12. Marketing — WhatsApp broadcasts
                                                                                                 
  ---                                                                                          
  Ready to start building? I'll begin with Phase 1 (foundation + folder restructure) and Phase 2 
  (complete auth system). This will involve:                                                     
  - Consolidating the duplicate route groups
  - Wiring up the features/ module structure                                                     
  - Building clean login/register/forgot-password/reset/verify + invite flow                     
  - Setting up RBAC permission matrix with all 6 roles                      
                                                                                                 
  Say "go" and I'll start immediately.   