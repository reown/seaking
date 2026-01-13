import abilitydesc from "./data/abilitydesc.json";
import typechart from "./data/typechart.json";
import abilitymulti from "./data/abilitymulti.json";

type StringMap = Record<string, string>;
type MultiMap = Record<string, number>;

export const getSprite = (name: string) => {
  //match base pokesprite syntax
  let spriteName = name
    .toLocaleLowerCase()
    .replace(/['.]/g, "")
    .replace(/\s+/g, "-")
    //nidorans
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m");

  //regional form syntax
  const replacements = [
    ["alolan", "alola"],
    ["galarian", "galar"],
  ];

  for (const [target, replacement] of replacements) {
    if (spriteName.includes(target)) {
      return spriteName
        .replace(target, replacement)
        .replace(
          /^([^-\s]+)-(.*)$/,
          (match, first, rest) => `${rest}-${first}`
        );
    }
  }

  return spriteName;
};

export const getDesc = (ability: string, isHA: boolean) => {
  const desc: StringMap = abilitydesc;

  //specify HA in description / return not found
  if (!desc[ability]) {
    return "Ability description not found";
  }

  return isHA ? `Hidden Ability: ${desc[ability]}` : desc[ability];
};

export const getMulti = (type: string[], activeAbility?: string) => {
  //shallow copy from json
  let multi: MultiMap = {
    ...typechart.find((def) => def.type === "default")!.multi,
  };

  //multiply multi for dual types
  type.map((type) => {
    const tempMulti: MultiMap = typechart.find(
      (item) => item.type === type
    )!.multi;
    Object.keys(tempMulti).forEach((key) => {
      multi[key] *= tempMulti[key];
    });
  });

  //check ability for multi
  if (activeAbility) {
    const amatch = abilitymulti.find(
      (item) => item.ability === activeAbility
    )?.multi;
    if (amatch) {
      const amulti: MultiMap = amatch as unknown as MultiMap;
      Object.keys(amulti).forEach((key) => {
        multi[key] *= amulti[key];
      });
    }
  }

  //split multi to weak/strong/immune
  const weak: MultiMap = {};
  const strong: MultiMap = {};
  const immune: MultiMap = {};
  Object.keys(multi).forEach((key) => {
    if (multi[key] > 1.0) {
      weak[key] = multi[key];
    } else if (multi[key] > 0.0 && multi[key] < 1.0) {
      strong[key] = multi[key];
    } else if (multi[key] === 0.0) {
      immune[key] = multi[key];
    }
  });

  return [weak, strong, immune];
};
