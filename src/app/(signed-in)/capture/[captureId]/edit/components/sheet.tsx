import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function SheetComponent({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex aspect-square items-center justify-center rounded-full md:hidden"
        >
          ?
        </Button>
      </SheetTrigger>
      <SheetContent side={"left"} className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="flex grow flex-col">
          <article className="prose leading-snug prose-neutral dark:prose-invert">
            {children}
          </article>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Got it!</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
