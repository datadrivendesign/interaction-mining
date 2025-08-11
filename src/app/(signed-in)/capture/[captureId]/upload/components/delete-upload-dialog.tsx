import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function DeleteUploadDialog({
  title,
  description,
  children,
  onContinue,
  deleteDrafts,
  setDeleteDrafts,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  onContinue: () => void;
  deleteDrafts: boolean;
  setDeleteDrafts: (deleteDrafts: boolean) => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title || "Are you absolutely sure?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description ||
              "This action cannot be undone. This will permanently delete the upload."}
          </AlertDialogDescription>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="delete-draft"
              checked={deleteDrafts}
              onCheckedChange={setDeleteDrafts}
            />
            <Label htmlFor="delete-draft">
              Delete auto-save drafts as well
            </Label>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
