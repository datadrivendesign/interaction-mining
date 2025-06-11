const works = [
  {
    title: "ODIM",
    description:
      "novel user interaction data collection architecture and repository",
    colors: ["sky", "blue"],
    link: null,
    image: null,
  },
  {
    title: "ZIPT",
    description: "zero-integration performance testing of mobile app designs",
    colors: ["violet", "indigo"],
    link: "/works/zipt",
    image: {
      light: "/zipt/zipt_teaser_light.png",
      dark: "/zipt/zipt_teaser_dark.png",
    },
  },
  {
    title: "Rico",
    description: "a mobile app dataset for building data-driven design apps",
    colors: ["pink", "rose"],
    link: "/works/rico",
    image: {
      light: "/rico/rico_teaser_light.png",
      dark: "/rico/rico_teaser_dark.png",
    },
  },
  {
    title: "ERICA",
    description: "an interaction mining tool for mobile apps",
    colors: ["orange", "amber"],
    link: "/works/erica",
    image: {
      light: "/erica/erica_teaser_light.png",
      dark: "/erica/erica_teaser_dark.png",
    },
  },
] as Work[];

type Work = {
  title: string;
  description?: string;
  colors: [string, string];
  link: string | null;
  image: {
    light?: string;
    dark?: string;
  } | null;
};

export default works;
