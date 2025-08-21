import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";

// TODO: add AlertDialog to show feedback
export const FeedbackDialog = ({
  annotateFeedback,
  redactFeedback,
  summarizeFeedback,
  children,
}: {
  annotateFeedback: string;
  redactFeedback: string;
  summarizeFeedback: string;
  children: React.ReactNode;
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Annotate Feedback</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap">
            {annotateFeedback || "No feedback provided"}
          </DialogDescription>
        </DialogHeader>
        <DialogHeader>
          <DialogTitle>Redact Feedback</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap">
            {redactFeedback || "No feedback provided"}
          </DialogDescription>
        </DialogHeader>
        <DialogHeader>
          <DialogTitle>Summarize Feedback</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap">
            {summarizeFeedback || "No feedback provided"}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
