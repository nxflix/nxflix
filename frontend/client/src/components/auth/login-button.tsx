import { useAuth } from '@/lib/auth';
import { useWalletNetwork } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogIn, LogOut, User, Wallet, Mail, Network } from 'lucide-react';

export function LoginButton() {
  const { isAuthenticated, isLoading, login, logout, userDisplayName, userEmail, userWallet } = useAuth();
  const { name: networkName, isSupported, chainId } = useWalletNetwork();

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button onClick={login} className="gap-2">
        <LogIn className="w-4 h-4" />
        Sign In
      </Button>
    );
  }

  // Get initials for avatar
  const initials = userDisplayName
    ? userDisplayName.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline max-w-[120px] truncate">
            {userDisplayName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">Account</p>
            {userEmail && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {userEmail}
              </p>
            )}
            {userWallet && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wallet className="w-3 h-3" />
                {userWallet.slice(0, 6)}...{userWallet.slice(-4)}
              </p>
            )}
            {chainId && (
              <div className="flex items-center gap-1 mt-1">
                <Network className="w-3 h-3 text-muted-foreground" />
                <Badge
                  variant={isSupported ? "default" : "destructive"}
                  className="text-xs px-1.5 py-0"
                >
                  {networkName}
                </Badge>
              </div>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="w-4 h-4 mr-2" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
