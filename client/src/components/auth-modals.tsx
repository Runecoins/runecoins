import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import logoPath from "@assets/920361e1-d9d6-42a7-b8f4-a1c173bc7ed1-removebg-preview_1771388848903.png";

interface AuthModalsProps {
  showLogin: boolean;
  showRegister: boolean;
  onCloseLogin: () => void;
  onCloseRegister: () => void;
  onSwitchToRegister: () => void;
  onSwitchToLogin: () => void;
}

export function AuthModals({
  showLogin,
  showRegister,
  onCloseLogin,
  onCloseRegister,
  onSwitchToRegister,
  onSwitchToLogin,
}: AuthModalsProps) {
  return (
    <>
      {showLogin && (
        <LoginModal
          onClose={onCloseLogin}
          onSwitchToRegister={onSwitchToRegister}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={onCloseRegister}
          onSwitchToLogin={onSwitchToLogin}
        />
      )}
    </>
  );
}

function LoginModal({
  onClose,
  onSwitchToRegister,
}: {
  onClose: () => void;
  onSwitchToRegister: () => void;
}) {
  const { toast } = useToast();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast({ title: "Sucesso", description: "Login realizado com sucesso!" });
      onClose();
    } catch (error: any) {
      const msg = error?.message?.includes("401") ? "Usuario ou senha incorretos" : "Erro ao fazer login";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-md overflow-hidden rounded-md border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-login"
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
          <h2 className="text-xl font-bold" data-testid="text-login-title">Acesse sua Conta</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-login">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex justify-center">
            <img src={logoPath} alt="RuneCoins" className="h-16 w-auto" />
          </div>

          <div className="space-y-4">
            <div>
              <Label className="mb-1 block text-sm font-medium">
                Usuario: <span className="text-primary">*</span>
              </Label>
              <Input
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-login-username"
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-medium">
                Senha: <span className="text-primary">*</span>
              </Label>
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                data-testid="input-login-password"
              />
            </div>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">E novo por aqui? </span>
            <button
              className="font-semibold text-primary"
              onClick={onSwitchToRegister}
              data-testid="link-switch-to-register"
            >
              Clique aqui para registrar-se
            </button>
            <br />
            <button className="mt-1 text-sm font-semibold text-primary" data-testid="link-forgot-password">
              Esqueci minha senha
            </button>
          </div>
        </div>

        <div className="flex gap-3 border-t border-border px-6 py-4">
          <Button className="flex-1 bg-green-600 text-white" onClick={handleSubmit} disabled={loading} data-testid="button-login-submit">
            {loading ? "ENTRANDO..." : "ENTRAR"}
          </Button>
          <Button className="flex-1 bg-primary text-white" onClick={onClose} data-testid="button-login-cancel">
            CANCELAR
          </Button>
        </div>
      </div>
    </div>
  );
}

function RegisterModal({
  onClose,
  onSwitchToLogin,
}: {
  onClose: () => void;
  onSwitchToLogin: () => void;
}) {
  const { toast } = useToast();
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim() || !fullName.trim() || !phone.trim() || !email.trim()) {
      toast({ title: "Erro", description: "Preencha todos os campos.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter no minimo 6 caracteres.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await register({ username, password, email, fullName, phone });
      toast({ title: "Sucesso", description: "Registro realizado com sucesso!" });
      onClose();
    } catch (error: any) {
      const msg = error?.message?.includes("400") ? "Nome de usuario ja existe" : "Erro ao registrar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-md overflow-hidden rounded-md border border-border bg-card"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-register"
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
          <h2 className="text-xl font-bold" data-testid="text-register-title">Registre-se Gratuitamente</h2>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-register">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex justify-center">
            <img src={logoPath} alt="RuneCoins" className="h-16 w-auto" />
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  Usuario: <span className="text-primary">*</span>
                </Label>
                <Input
                  placeholder="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  data-testid="input-register-username"
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  Senha: <span className="text-primary">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="Senha (min 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-register-password"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-sm font-medium">
                Nome: <span className="text-primary">*</span>
              </Label>
              <Input
                placeholder="Nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                data-testid="input-register-name"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  Celular / Whatsapp: <span className="text-primary">*</span>
                </Label>
                <Input
                  placeholder="Celular / Whatsapp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  data-testid="input-register-phone"
                />
              </div>
              <div>
                <Label className="mb-1 block text-sm font-medium">
                  E-mail: <span className="text-primary">*</span>
                </Label>
                <Input
                  placeholder="Seu e-mail de verificacao"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="input-register-email"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Ja possui uma conta? </span>
            <button
              className="font-semibold text-primary"
              onClick={onSwitchToLogin}
              data-testid="link-switch-to-login"
            >
              Clique aqui para acessa-la
            </button>
          </div>
        </div>

        <div className="flex gap-3 border-t border-border px-6 py-4">
          <Button className="flex-1 bg-green-600 text-white" onClick={handleSubmit} disabled={loading} data-testid="button-register-submit">
            {loading ? "REGISTRANDO..." : "REGISTRAR"}
          </Button>
          <Button className="flex-1 bg-primary text-white" onClick={onClose} data-testid="button-register-cancel">
            CANCELAR
          </Button>
        </div>
      </div>
    </div>
  );
}
