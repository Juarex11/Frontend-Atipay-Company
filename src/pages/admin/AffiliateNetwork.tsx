import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, ChevronDown, Search } from "lucide-react";

import { referralService, type ReferralUser } from "@/services/referral.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ReferralLevel = {
  level: number;
  users: ReferralUser[];
};

export default function AffiliateNetwork() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"mine" | "user">("mine");
  const [searchTerm, setSearchTerm] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<ReferralUser | null>(null);

  /* ============================================================
     🔍 BÚSQUEDA GLOBAL (solo admin)
  ============================================================ */
  const { data: searchData } = useQuery<ReferralUser[]>({
    queryKey: ["userSearch", globalSearch],
    queryFn: () => referralService.searchUsers(globalSearch),
    enabled: globalSearch.length > 2,
    staleTime: 1000 * 30, // 30 segundos
  });

  const safeSearchResults = searchData ?? [];

  /* ============================================================
     🔥 MI RED PERSONAL
  ============================================================ */
  const { data: myNetwork } = useQuery({
    queryKey: ["myReferralNetwork"],
    queryFn: () => referralService.getReferralNetwork(),
    staleTime: 1000 * 60, // cache 1 min
  });

  /* ============================================================
     🔥 RED DE OTRO USUARIO (solo admin)
  ============================================================ */
  const { data: userNetwork } = useQuery({
    queryKey: ["otherUserNetwork", selectedUser?.id],
    queryFn: () => (selectedUser?.id ? referralService.getNetworkForUser(selectedUser.id) : undefined),
    enabled: !!selectedUser?.id,
  });

  /* ============================================================
     🔧 PROCESAR NIVELES (nivel_1, nivel_2, etc.)
  ============================================================ */
  const processLevels = (dataObj?: Record<string, unknown>): ReferralLevel[] => {
    if (!dataObj) return [];

    return Object.entries(dataObj)
      .filter(([_, users]) => Array.isArray(users))
      .map(([key, users]) => ({
        level: Number(key.replace("nivel_", "")),
        users: (users as ReferralUser[]).map((u) => ({ ...u, status: "active" })),
      }))
      .sort((a, b) => a.level - b.level);
  };

  const referralLevels = useMemo(() => processLevels(myNetwork?.data), [myNetwork]);
  const userReferralLevels = useMemo(() => processLevels(userNetwork?.data), [userNetwork]);

  const currentLevels = activeTab === "mine" ? referralLevels : userReferralLevels;

  /* ============================================================
     🔎 FILTRO LOCAL (input interno)
  ============================================================ */
  const filteredLevels = useMemo(() => {
    if (!searchTerm) return currentLevels;

    const term = searchTerm.toLowerCase();

    return currentLevels
      .map((level) => ({
        ...level,
        users: level.users.filter(
          (u) =>
            u.username.toLowerCase().includes(term) ||
            u.email.toLowerCase().includes(term)
        ),
      }))
      .filter((l) => l.users.length > 0);
  }, [currentLevels, searchTerm]);

  /* ============================================================
     🔔 EFECTOS
  ============================================================ */
  useEffect(() => setSelectedLevel(null), [selectedUser]);

  useEffect(() => {
    setSearchTerm("");
    setGlobalSearch("");
    if (activeTab === "mine") setSelectedUser(null);
  }, [activeTab]);

  /* ============================================================
     📌 RENDER DE LISTA DE NIVELES
  ============================================================ */
  const renderLevelSection = (level: ReferralLevel) => {
    const isExpanded = selectedLevel === level.level;

    return (
      <div key={`level-${level.level}`} className="mb-6">
        <button
          onClick={() => setSelectedLevel(isExpanded ? null : level.level)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
        >
          <h3 className="font-medium">
            Nivel {level.level} — {level.users.length}{" "}
            {level.users.length === 1 ? "usuario" : "usuarios"}
          </h3>
          <ChevronDown
            className={`h-5 w-5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </button>

        {isExpanded && (
          <div className="mt-2 bg-white rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha de Registro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {level.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge>Activo</Badge></TableCell>
                    <TableCell>
                      {user.registration_date
                        ? format(new Date(user.registration_date), "PP", { locale: es })
                        : "N/A"}
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

  /* ============================================================
     🎨 UI FINAL
  ============================================================ */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Red de Afiliados</h1>
        <p className="text-sm text-muted-foreground">
          Visualiza y gestiona la red de referidos
        </p>

        <div className="mt-4 flex gap-2 border-b pb-2">
          <Button
            variant={activeTab === "mine" ? "default" : "outline"}
            onClick={() => setActiveTab("mine")}
          >
            Mi Red
          </Button>

          <Button
            variant={activeTab === "user" ? "default" : "outline"}
            onClick={() => setActiveTab("user")}
          >
            Red de Usuario
          </Button>
        </div>
      </div>

      {/* ====================== BUSCADOR GLOBAL ====================== */}
      {activeTab === "user" && (
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Buscar usuario</h3>

          <div className="flex gap-2">
            <Input
              placeholder="Buscar por username o email"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
            <Search className="w-5 h-5 text-muted-foreground" />
          </div>

          {safeSearchResults.length > 0 && (
            <div className="mt-3 space-y-1 max-h-60 overflow-y-auto border rounded-md p-2 bg-gray-50">
              {safeSearchResults.map((u) => (
                <button
                  key={u.id}
                  className="w-full text-left p-2 rounded hover:bg-gray-100 transition"
                  onClick={() => setSelectedUser(u)}
                >
                  <span className="font-medium">{u.username}</span>{" "}
                  <span className="text-muted-foreground text-xs">({u.email})</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ======================== CARD PRINCIPAL ======================== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {activeTab === "mine"
                ? "Mi Red"
                : selectedUser
                ? `Red de: ${selectedUser.username}`
                : "Busca un usuario"}
            </CardTitle>

            <Badge variant="outline">
              <Users className="mr-1 h-3 w-3" />
              {filteredLevels.reduce((t, l) => t + l.users.length, 0)} usuarios
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <Input
            placeholder="Filtrar en esta red..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          {filteredLevels.map(renderLevelSection)}

          {!filteredLevels.length && (
            <div className="text-center text-muted-foreground py-8">
              Sin resultados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
