import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { sql, desc, asc, ilike, and, count } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { OrgsClient } from "./orgs-client";

interface Props {
  searchParams: {
    page?: string;
    limit?: string;
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    category?: string;
  };
}

export default async function SuperadminOrgsPage({ searchParams }: Props) {
  const user = await requireAuth();
  if (user.email !== process.env.SUPERADMIN_EMAIL) {
    redirect("/workspace");
  }

  const page = Math.max(parseInt(searchParams.page || "1"), 1);
  const limit = Math.max(parseInt(searchParams.limit || "100"), 1); // Load more for client-side sorting/filtering
  const search = searchParams.search || "";
  const sort = searchParams.sort || "created_at";
  const order = searchParams.order || "desc";
  const skip = (page - 1) * limit;

  const whereClause = search 
    ? ilike(organizations.name, `%${search}%`)
    : undefined;

  const orderBy = order === "desc" 
    ? desc(organizations[sort as keyof typeof organizations] as any) 
    : asc(organizations[sort as keyof typeof organizations] as any);

  const [totalCount] = await db
    .select({ count: count() })
    .from(organizations)
    .where(whereClause);

  const orgList = await db
    .select()
    .from(organizations)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limit)
    .offset(skip);

  const totalPages = Math.ceil(totalCount.count / limit);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">Manage all businesses registered on Billora ERP.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/superadmin">Back to Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <form action="" method="GET">
                <Input 
                  name="search"
                  defaultValue={search}
                  placeholder="Search organizations..." 
                  className="pl-9"
                />
              </form>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" /> Filter
              </Button>
              <Button size="sm">Export CSV</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <OrgsClient data={orgList} />
          
          {/* Server-side Pagination remains for large datasets */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{skip + 1}</span> to <span className="font-medium">{Math.min(skip + limit, totalCount.count)}</span> of <span className="font-medium">{totalCount.count}</span> results
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild={page > 1}
                  disabled={page <= 1}
                >
                  {page > 1 ? (
                    <Link href={`/superadmin/organizations?page=${page - 1}&search=${search}`}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Link>
                  ) : (
                    <span className="flex items-center">
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </span>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild={page < totalPages}
                  disabled={page >= totalPages}
                >
                  {page < totalPages ? (
                    <Link href={`/superadmin/organizations?page=${page + 1}&search=${search}`}>
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  ) : (
                    <span className="flex items-center">
                      Next <ChevronRight className="h-4 w-4 ml-1" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
