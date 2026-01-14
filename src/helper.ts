import abilityDescData from "./data/abilitydesc.json";
import typeChartData from "./data/typechart.json";
import abilityMultiData from "./data/abilitymulti.json";

interface TypeChartMap {
  type: string;
  multi: { [key: string]: number };
}

interface AbilityMultiMap {
  ability: string;
  multi: Partial<MultiMap>;
}

type MultiMap = Record<string, number>;

const abilityDesc: Record<string, string> = abilityDescData;
const typeChart: TypeChartMap[] = typeChartData;
const abilityMulti: AbilityMultiMap[] = abilityMultiData;

export const getSprite = (name: string, tag: string) => {
  //match base pokesprite syntax
  let spriteName = name
    .toLocaleLowerCase()
    .replace(/['.]/g, "")
    .replace(/\s+/g, "-")
    //nidorans
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m");

  if (tag) {
    spriteName = spriteName.concat("-", tag.toLowerCase());
  }

  return spriteName;
};

export const getDesc = (ability: string, isHA: boolean) => {
  //specify HA in description / return not found
  if (!abilityDesc[ability]) {
    return "Ability description not found";
  }

  return isHA
    ? `Hidden Ability: ${abilityDesc[ability]}`
    : abilityDesc[ability];
};

export const getMulti = (type: string[], activeAbility?: string) => {
  //shallow copy from json
  let multi = {
    ...typeChart.find((def) => def.type === "default")!.multi,
  };

  //multiply multi for dual types
  type.map((type) => {
    const tempMulti = typeChart.find((item) => item.type === type)!.multi;
    Object.keys(tempMulti).forEach((key) => {
      multi[key] *= tempMulti[key];
    });
  });

  //check ability for multi
  if (activeAbility) {
    const amatch = abilityMulti.find(
      (item) => item.ability === activeAbility
    )?.multi;
    if (amatch) {
      Object.keys(amatch).forEach((key) => {
        if (amatch[key] !== undefined) {
          multi[key] *= amatch[key];
        }
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
