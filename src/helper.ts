import pokedexData from "./data/pokedex.json";
import nofairydexData from "./data/nofairydex.json";
import altformdexData from "./data/altformdex.json";
import abilityDescData from "./data/abilitydesc.json";
import typeChartData from "./data/typechart.json";
import abilityMultiData from "./data/abilitymulti.json";

interface PokedexMap {
  id: number;
  name: string;
  type: string[];
  ability: string[];
}

interface AltformdexMap {
  id: number;
  name: string;
  base: string;
  tag: string;
  type: string[];
  ability: string[];
}

interface TypeChartMap {
  type: string;
  multi: MultiMap;
}

interface AbilityMultiMap {
  ability: string;
  multi: Partial<MultiMap>;
}

type MultiMap = Record<string, number>;
type ActiveAbilityMap = Record<string, string>;

const pokedex: PokedexMap[] = pokedexData;
const nofairydex: PokedexMap[] = nofairydexData;
const altformdex: AltformdexMap[] = altformdexData;
const abilityDesc: Record<string, string> = abilityDescData;
const typeChart: TypeChartMap[] = typeChartData;
const abilityMulti: AbilityMultiMap[] = abilityMultiData;

export const getPokemon = (e: string, fairy: boolean) => {
  //search pokedex for names that includes substring
  const checkf = pokedex.filter((item) =>
    item.name.toLowerCase().includes(e.toLowerCase())
  );

  //check if fairy is toggled, replace from nofairydex
  if (fairy) {
    const checknf = checkf.map((item) => {
      const match = nofairydex.find((item2) => item.id === item2.id);

      return match ? match : item;
    });

    return checknf;
  } else {
    return checkf;
  }
};

export const getAltform = (id: number) => {
  return altformdex.filter((item) => item.id === id);
};

export const getDefActive = (prev: ActiveAbilityMap, found: PokedexMap[]) => {
  //combine pokedex and altformdex matches
  const defActive: ActiveAbilityMap = {};
  found.forEach((found) => {
    const rmatch = altformdex.filter((item) => item.id === found.id);
    const allMatches = [...rmatch, found];

    //check for ability that affects type chart
    allMatches.forEach((match) => {
      const amatch = match.ability.find((item) =>
        abilityMulti.some((item2) => item === item2.ability)
      );
      if (amatch) {
        defActive[match.name] = amatch;
      }
    });
  });

  //sets active ability / don't overwrite known
  const newState = { ...prev };
  if (Object.keys(defActive).length > 0) {
    Object.keys(defActive).forEach((key) => {
      if (!(key in newState)) {
        newState[key] = defActive[key];
      }
    });
  }

  return newState;
};

export const getSpriteName = (name: string, tag: string) => {
  //match base pokesprite syntax
  let spriteName = name
    .toLowerCase()
    .replace(/['.]/g, "")
    .replace(/\s+/g, "-")
    //nidorans
    .replace(/♀/g, "-f")
    .replace(/♂/g, "-m");

  //concat tag for alt forms syntax
  if (tag) {
    spriteName = spriteName.concat("-", tag.toLowerCase());
  }

  return spriteName;
};

export const getAbilityDesc = (ability: string, isHA: boolean) => {
  //specify HA in description / return not found
  if (!abilityDesc[ability]) {
    return "Ability description not found";
  }

  return isHA
    ? `Hidden Ability: ${abilityDesc[ability]}`
    : abilityDesc[ability];
};

export const getTypeMulti = (type: string[], activeAbility: string) => {
  //shallow copy default from json
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
      //const bmatch = amatch as unknown as MultiMap;
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
