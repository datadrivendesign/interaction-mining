import { createContext } from "react";

import { Screen } from "@prisma/client";

const FormContext = createContext<{
    screens: Screen[];
    setScreens: React.Dispatch<React.SetStateAction<Screen[]>>;
}>({
    screens: [],
    setScreens: () => { },
});
