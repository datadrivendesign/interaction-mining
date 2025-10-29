import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import Link from "next/link";
import { AlertCircle, Users } from "lucide-react";

interface AdminNavBarProps {
  currentRoute: string;
  showTasksLink?: boolean;
  showUsersLink?: boolean;
  additionalLinks?: { label: string; href: string; icon?: React.ReactNode }[];
  label?: string;
}

/**
 * AdminNavBar provides navigation buttons between admin sections
 * @param currentRoute - Current active route for highlighting
 * @param showTasksLink - Whether to show link to tasks panel (default: true)
 * @param showUsersLink - Whether to show link to users panel(default: true)
 * @param additionalLinks - Optional array of additional nav items
 * @param label - Custom label text (default: "Navigate To:")
 */
export function AdminNavBar({
  currentRoute,
  showTasksLink = true,
  showUsersLink = true,
  additionalLinks = [],
  label = "Navigate To:",
}: AdminNavBarProps) {
  const navButtons = [];

  // Add tasks link if enabled
  if (showTasksLink) {
    navButtons.push(
      <Button
        key="tasks"
        variant="outline"
        size="sm"
        asChild
        className={currentRoute === "/admin/tasks" ? "bg-muted" : ""}
      >
        <Link href="/admin/tasks">
          <AlertCircle className="w-4 h-4 mr-2" />
          Review Tasks
        </Link>
      </Button>
    );
  }

  // Add users link if enabled
  if (showUsersLink) {
    navButtons.push(
      <Button
        key="users"
        variant="outline"
        size="sm"
        asChild
        className={currentRoute === "/admin/users" ? "bg-muted" : ""}
      >
        <Link href="/admin/users">
          <Users className="w-4 h-4 mr-2" />
          All Users Panel
        </Link>
      </Button>
    );
  }

  // Add additional links
  additionalLinks.forEach((link, index) => {
    navButtons.push(
      <Button
        key={`additional-${index}`}
        variant="outline"
        size="sm"
        asChild
        className={currentRoute === link.href ? "bg-muted" : ""}
      >
        <Link href={link.href}>
          {link.icon && <span className="w-4 h-4 mr-2">{link.icon}</span>}
          {link.label}
        </Link>
      </Button>
    );
  });

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-md font-bold tracking-tight">{label}</span>
      <ButtonGroup>{navButtons}</ButtonGroup>
    </div>
  );
}
