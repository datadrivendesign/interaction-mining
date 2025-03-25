import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function SheetComponent({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {/* <Button variant="outline" className="flex justify-center items-center gap-1 aspect-square rounded-full">?</Button> */}
        <Button variant="outline" size="sm" className="flex justify-center items-center aspect-square rounded-full">?</Button>
      </SheetTrigger>
      <SheetContent side={"left"} className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription hidden>
            {description}
          </SheetDescription>
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
  )
}
