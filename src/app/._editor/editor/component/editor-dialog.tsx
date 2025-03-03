import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function EditorDialog({
  children,
  label,
  title,
  description,
}: {
  children: React.ReactNode;
  label: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>{label}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            <DialogFooter>{children}</DialogFooter>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EditorDialogButton({
  children,
  ...props
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DialogClose {...props} asChild>
        {children}
      </DialogClose>
    </>
  );
}
