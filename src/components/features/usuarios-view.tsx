"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2, Pencil, Trash2, Shield, Users, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: "ADMIN" | "SINDICO" | "RONDA" | "ADVOGADO";
  isMaster: boolean;
  condoId: string | null;
  condominiums: { condominiumId: string }[];
};

type Condo = { id: string; name: string };

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Mín. 6 caracteres").or(z.literal("")),
  fullName: z.string().optional(),
  role: z.enum(["ADMIN", "SINDICO", "RONDA", "ADVOGADO"]),
  isMaster: z.boolean().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

async function fetchUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/admin-users");
  if (!res.ok) throw new Error("Falha");
  return (await res.json()).items;
}

async function fetchCondos(): Promise<Condo[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}`+"/api/condominiums");
  if (!res.ok) return [];
  const json = await res.json();
  return json.items ?? [];
}

const ROLE_LABELS: Record<AdminUser["role"], string> = {
  ADMIN: "Admin",
  SINDICO: "Síndico",
  RONDA: "Ronda",
  ADVOGADO: "Advogado",
};

export function UsuariosView() {
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [linking, setLinking] = useState<AdminUser | null>(null);

  const { data: users = [], isLoading } = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/admin-users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
    },
    onSuccess: () => { toast.success("Usuário removido"); qc.invalidateQueries({ queryKey: ["admin-users"] }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  return (
    <div className="space-y-4">
      <Button onClick={() => setCreating(true)} className="gap-2">
        <Plus className="size-3.5" aria-hidden /> Novo usuário
      </Button>

      {isLoading ? (
        <div className="py-8 flex items-center gap-2 text-muted-foreground"><Loader2 className="size-4 animate-spin" aria-hidden /> Carregando...</div>
      ) : users.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <Users className="size-8 mx-auto text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground mt-2">Nenhum usuário</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Condos</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.fullName ?? u.email}</div>
                    {u.fullName && <div className="text-xs text-muted-foreground">{u.email}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={u.isMaster ? "default" : "secondary"}>
                        {u.isMaster && <Shield className="size-3 mr-1" aria-hidden />}
                        {u.isMaster ? "Master" : ROLE_LABELS[u.role]}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.condominiums.length > 0 ? `${u.condominiums.length} vinculado(s)` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setLinking(u)} aria-label="Vincular condomínios">
                      <Building2 className="size-3.5" aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => setEditing(u)} aria-label="Editar">
                      <Pencil className="size-3.5" aria-hidden />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => { if (confirm(`Excluir ${u.email}?`)) del.mutate(u.id); }} aria-label="Excluir">
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(creating || editing) && (
        <UserFormDialog user={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-users"] })} />
      )}

      {linking && (
        <CondoLinkDialog user={linking} onClose={() => setLinking(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-users"] })} />
      )}
    </div>
  );
}

function UserFormDialog({ user, onClose, onSaved }: { user: AdminUser | null; onClose: () => void; onSaved: () => void }) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      email: user?.email ?? "",
      password: "",
      fullName: user?.fullName ?? "",
      role: (user?.role ?? "ADMIN") as CreateForm["role"],
      isMaster: user?.isMaster ?? false,
    },
  });

  async function submit(data: CreateForm) {
    try {
      const payload: Record<string, unknown> = {
        email: data.email,
        fullName: data.fullName || null,
        role: data.role,
        isMaster: data.isMaster ?? false,
      };
      if (data.password) payload.password = data.password;

      const res = await fetch(user ? `/api/admin-users/${user.id}` : "/api/admin-users", {
        method: user ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Falha");
      toast.success(user ? "Atualizado" : "Usuário criado");
      onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? "Editar usuário" : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            Master tem acesso a tudo. Outros papéis dependem do vínculo com condomínios.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="u-name">Nome completo</Label>
            <Input id="u-name" {...register("fullName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-email">E-mail</Label>
            <Input id="u-email" {...register("email")} aria-invalid={!!errors.email} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-pwd">{user ? "Nova senha (opcional)" : "Senha"}</Label>
            <Input id="u-pwd" type="password" {...register("password")} aria-invalid={!!errors.password} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-role">Role</Label>
            <Select value={watch("role")} onValueChange={(v) => setValue("role", (v ?? "ADMIN") as CreateForm["role"])}>
              <SelectTrigger id="u-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(ROLE_LABELS) as [CreateForm["role"], string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span>
              <span className="font-medium">Master</span>
              <span className="block text-sm text-muted-foreground">Acesso total ignorando vínculo de condos.</span>
            </span>
            <input type="checkbox" {...register("isMaster")} className="size-5 accent-primary" />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CondoLinkDialog({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const { data: condos = [] } = useQuery({ queryKey: ["condominiums"], queryFn: fetchCondos });
  const [selected, setSelected] = useState(new Set(user.condominiums.map((c) => c.condominiumId)));
  const [submitting, setSubmitting] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save() {
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/admin-users/${user.id}/condominiums`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condoIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error("Falha");
      toast.success(`${selected.size} condomínio(s) vinculado(s)`);
      onSaved(); onClose();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
    finally { setSubmitting(false); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Condomínios · {user.email}</DialogTitle>
          <DialogDescription>Selecione os condomínios em que este usuário pode operar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {condos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum condomínio cadastrado.</p>
          ) : (
            condos.map((c) => (
              <label key={c.id} className="flex items-center gap-3 rounded-md p-2 hover:bg-muted cursor-pointer">
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} className="size-4 accent-primary" />
                <span>{c.name}</span>
              </label>
            ))
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={submitting}>
            {submitting && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
            Salvar vínculos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
