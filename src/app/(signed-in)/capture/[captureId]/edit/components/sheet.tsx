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
          className="md:hidden flex justify-center items-center aspect-square rounded-full"
        >
          ?
        </Button>
      </SheetTrigger>
      <SheetContent side={"left"} className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col grow">
          <article className="prose prose-neutral dark:prose-invert leading-snug">
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
