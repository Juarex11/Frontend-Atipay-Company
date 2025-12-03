import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

import {
  referralService,
  type ReferralUser,
} from "@/services/referral.service";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// 🔥 Modal
import UserDetailsModal from "../../components/affiliates/UserDetailsModal";

type ReferralLevel = {
  level: number;
  users: ReferralUser[];
};

export default function AffiliateNetwork() {
  // Estados generales
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // PAGINACIÓN TAB 1
  const [pageLevel, setPageLevel] = useState(1);
  const itemsPerPageLevel = 10;

  // PAGINACIÓN TAB 2
  const [pageUsers, setPageUsers] = useState(1);
  const itemsPerPageUsers = 10;

  // TAB 1
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["adminAffiliateNetwork"],
    queryFn: () => referralService.getReferralNetwork(),
  });

  const referralLevels = useMemo(() => {
    if (!data?.data) return [];

    return Object.entries(data.data).map(([key, users]) => ({
      level: parseInt(key.split("_")[1]),
      users: users.map((u) => ({ ...u, status: "active" })),
    }));
  }, [data]);

  const filteredLevels = useMemo(() => {
    if (!searchTerm) return referralLevels;

    const term = searchTerm.toLowerCase();
    return referralLevels
      .map((level) => ({
        ...level,
        users: level.users.filter(
          (u) =>
            u.username.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term)
        ),
      }))
      .filter((level) => level.users.length > 0);
  }, [referralLevels, searchTerm]);

  // Calcular paginación de niveles
  const totalLevels = filteredLevels.length;
  const paginatedLevels = filteredLevels.slice(
    (pageLevel - 1) * itemsPerPageLevel,
    pageLevel * itemsPerPageLevel
  );

  const handleViewLevel = (level: number) => {
    setSelectedLevel(selectedLevel === level ? null : level);
  };

  const handleRefresh = () => refetch();

  // TAB 2
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery({
    queryKey: ["adminUserList"],
    queryFn: () => referralService.getUsersList(),
  });

  const [searchTermUsers, setSearchTermUsers] = useState("");

  const filteredUsers = useMemo(() => {
    if (!users?.data) return [];

    const term = searchTermUsers.toLowerCase();

    return users.data.filter(
      (u: any) =>
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
    );
  }, [users, searchTermUsers]);

  const totalUsers = filteredUsers.length;
  const paginatedUsers = filteredUsers.slice(
    (pageUsers - 1) * itemsPerPageUsers,
    pageUsers * itemsPerPageUsers
  );

  // Estados de carga
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        <p className="text-muted-foreground">Cargando red de afiliados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-destructive">Error al cargar la red de afiliados</p>
        <Button variant="outline" onClick={handleRefresh}>
          Reintentar
        </Button>
      </div>
    );
  }

  const renderLevelSection = (level: ReferralLevel) => {
  const isExpanded = selectedLevel === level.level;

  return (
    <div key={`level-${level.level}`} className="mb-6 border rounded-lg">
      <button
        onClick={() => handleViewLevel(level.level)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors rounded-lg"
      >
        <h3 className="font-medium">Nivel {level.level}</h3>

        <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
          {level.users.length}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 bg-white rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-green-900 to-green-500 text-white">
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {level.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.username}</TableCell>

                  <TableCell>
                    <a
                      href={`mailto:${u.email}`}
                      className="text-blue-600 underline"
                    >
                      {u.email}
                    </a>
                  </TableCell>

                  <TableCell>
                    <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                      Activo
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};


  return (
    <Tabs defaultValue="levels" className="w-full space-y-6">
      <TabsList>
        <TabsTrigger value="levels">Red por niveles</TabsTrigger>
        <TabsTrigger value="user">Red por usuario</TabsTrigger>
      </TabsList>

      {/* TAB 1 */}
      <TabsContent value="levels">
        <Card>
          <CardHeader>
            <CardTitle>Red de Afiliados</CardTitle>
          </CardHeader>

          <CardContent>
            {/* Buscador */}
            <Input
              placeholder="Buscar usuario o email…"
              value={searchTerm}
              onChange={(e) => {
                setPageLevel(1);
                setSearchTerm(e.target.value);
              }}
              className="mb-4"
            />

            {/* Resultados */}
            {paginatedLevels.map(renderLevelSection)}

            {/* Paginación */}
            {totalLevels > itemsPerPageLevel && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageLevel === 1}
                  onClick={() => setPageLevel(pageLevel - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>

                <span>
                  Página <strong>{pageLevel}</strong> de{" "}
                  <strong>{Math.ceil(totalLevels / itemsPerPageLevel)}</strong>
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    pageLevel === Math.ceil(totalLevels / itemsPerPageLevel)
                  }
                  onClick={() => setPageLevel(pageLevel + 1)}
                >
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* TAB 2 */}
      <TabsContent value="user">
        <Card>
          <CardHeader>
            <CardTitle>Usuarios registrados</CardTitle>
          </CardHeader>

          <CardContent>
            {/* Buscador TAB2 */}
            <Input
              placeholder="Buscar usuario o correo…"
              value={searchTermUsers}
              onChange={(e) => {
                setPageUsers(1);
                setSearchTermUsers(e.target.value);
              }}
              className="mb-4"
            />

            {usersLoading && <p>Cargando usuarios…</p>}

            {usersError && (
              <p className="text-red-600">Error al cargar usuarios</p>
            )}

            {paginatedUsers.length > 0 && (
              <>
                <Table>
                  <TableHeader className="bg-gradient-to-r from-green-900 to-green-500 text-white">
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Red de Afiliados</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {paginatedUsers.map((u: any) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.id}</TableCell>

                        <TableCell>{u.username}</TableCell>

                        <TableCell>
                          <a
                            href={`mailto:${u.email}`}
                            className="text-blue-600 underline"
                          >
                            {u.email}
                          </a>
                        </TableCell>

                        <TableCell>
                          <Badge className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">Activo</Badge>
                        </TableCell>

                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => setSelectedUser(u)}
                            className="flex items-center gap-1"
                          >
                            Ver Red <ChevronDown className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginación TAB 2 */}
                {totalUsers > itemsPerPageUsers && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pageUsers === 1}
                      onClick={() => setPageUsers(pageUsers - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>

                    <span>
                      Página <strong>{pageUsers}</strong> de{" "}
                      <strong>
                        {Math.ceil(totalUsers / itemsPerPageUsers)}
                      </strong>
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={
                        pageUsers ===
                        Math.ceil(totalUsers / itemsPerPageUsers)
                      }
                      onClick={() => setPageUsers(pageUsers + 1)}
                    >
                      Siguiente <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* 🔥 Modal */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </Tabs>
  );
}
