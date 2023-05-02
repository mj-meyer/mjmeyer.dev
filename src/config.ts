import type { Site, SocialObjects } from "./types";

export const SITE: Site = {
  website: "https://mjmeyer.dev",
  author: "MJ Meyer | Dadalorian",
  desc: "A developer's digital garden - a place to share my thoughts, ideas, projects and random findings across the interwebs.",
  title: "MJ Meyer",
  ogImage: "mjmeyer-og.jpg",
  lightAndDarkMode: true,
  postPerPage: 3,
};

export const LOGO_IMAGE = {
  enable: true,
  svg: true,
  width: 525,
  height: 140.38,
};

export const SOCIALS: SocialObjects = [
  {
    name: "Twitter",
    href: "https://twitter.com/_mjmeyer",
    linkTitle: `${SITE.title} on Twitter`,
    active: true,
  },
  {
    name: "Github",
    href: "https://github.com/mj-meyer",
    linkTitle: ` ${SITE.title} on Github`,
    active: true,
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/mj-meyer-500bb520/",
    linkTitle: `${SITE.title} on LinkedIn`,
    active: true,
  },
  {
    name: "Facebook",
    href: "",
    linkTitle: `${SITE.title} on Facebook`,
    active: false,
  },
  {
    name: "Instagram",
    href: "",
    linkTitle: `${SITE.title} on Instagram`,
    active: false,
  },
  {
    name: "Mail",
    href: "mailto:hello@mjmeyer.dev",
    linkTitle: `Send an email to ${SITE.title}`,
    active: true,
  },
  {
    name: "Twitch",
    href: "https://www.twitch.tv/dadalorian_dev",
    linkTitle: `${SITE.title} on Twitch`,
    active: false,
  },
  {
    name: "YouTube",
    href: "https://www.youtube.com/@dadalorian_dev",
    linkTitle: `${SITE.title} on YouTube`,
    active: false,
  },
  {
    name: "Pinterest",
    href: "",
    linkTitle: `${SITE.title} on Pinterest`,
    active: false,
  },
  {
    name: "TikTok",
    href: "",
    linkTitle: `${SITE.title} on TikTok`,
    active: false,
  },
  {
    name: "CodePen",
    href: "",
    linkTitle: `${SITE.title} on CodePen`,
    active: false,
  },
  {
    name: "Discord",
    href: "",
    linkTitle: `${SITE.title} on Discord`,
    active: false,
  },
  {
    name: "GitLab",
    href: "",
    linkTitle: `${SITE.title} on GitLab`,
    active: false,
  },
  {
    name: "Reddit",
    href: "",
    linkTitle: `${SITE.title} on Reddit`,
    active: false,
  },
  {
    name: "Steam",
    href: "",
    linkTitle: `${SITE.title} on Steam`,
    active: false,
  },
  {
    name: "Telegram",
    href: "",
    linkTitle: `${SITE.title} on Telegram`,
    active: false,
  },
  {
    name: "Mastodon",
    href: "",
    linkTitle: `${SITE.title} on Mastodon`,
    active: false,
  },
];
