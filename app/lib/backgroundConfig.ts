export const backgroundConfig = {
  // Put your image in app/public/backgrounds and set the path below.
  // Example: /backgrounds/my-hero.jpg
  imagePath: "/backgrounds/scroll/real_hero_bg.png",
  size: "cover" as const,
  position: "center top",
  repeat: "no-repeat" as const,
  attachment: "scroll" as const
};

export function appBackgroundStyle() {
  if (!backgroundConfig.imagePath) return {};

  return {
    backgroundImage: `linear-gradient(180deg, rgba(7,10,18,0.58), rgba(7,10,18,0.78)), url(${backgroundConfig.imagePath})`,
    backgroundSize: backgroundConfig.size,
    backgroundPosition: backgroundConfig.position,
    backgroundRepeat: backgroundConfig.repeat,
    backgroundAttachment: backgroundConfig.attachment
  };
}
