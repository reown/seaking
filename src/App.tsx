import { useEffect, useState } from "react";
import pokedex from "./data/pokedex.json";
import pokedexnf from "./data/pokedexnofairy.json";
import regionaldex from "./data/regionaldex.json";
import typechart from "./data/typechart.json";
import abilitymulti from "./data/abilitymulti.json";
import abilitydescjson from "./data/abilitydesc.json";
import "./css/App.css";
import "./css/Type.css";

interface pokedexType {
  id: number;
  name: string;
  type: string[];
  ability: string[];
}

interface multiType {
  [key: string]: number;
}

interface abilityDescType {
  [key: string]: string;
}

type activeAbilityType = Record<string, string>;

function App() {
  const [query, setQuery] = useState<string>("");
  const [found, setFound] = useState<pokedexType[]>([]);
  const [fairy, setFairy] = useState<boolean>(false);
  const [shiny, setShiny] = useState<boolean>(false);
  const [hoverAbility, setHoverAbility] = useState<string | null>(null);
  const [hoverPokemon, setHoverPokemon] = useState<string | null>(null);
  const [activeAbility, setActiveAbility] = useState<activeAbilityType>({});
  const abilitydesc = abilitydescjson as abilityDescType;

  useEffect(() => {
    getPokemon(query);
  }, [fairy]);

  useEffect(() => {
    const temp: activeAbilityType = {};

    //check for ability that affects type chart
    found.forEach((found) => {
      const firstmatch = found.ability.find((item) =>
        abilitymulti.some((item2) => item === item2.ability)
      );
      if (firstmatch) {
        temp[found.name] = firstmatch;
      }
    });
    if (temp) {
      setActiveAbility((prev) => ({ ...prev, ...temp }));
    }
  }, [found]);

  const getPokemon = (e: string) => {
    setQuery(e);
    setFound([]);
    setActiveAbility({});

    //search pokedex for names that includes substring
    if (e.length > 2) {
      const checkf = pokedex.filter((item) =>
        item.name.toLowerCase().includes(e.toLowerCase())
      );

      //check if fairy is toggled, replace from pokedex_nofairy
      if (fairy) {
        const checknf = checkf.map((item) => {
          const match = pokedexnf.find((item2) => item.id === item2.id);

          return match ? match : item;
        });
        setFound(checknf);
      } else {
        setFound(checkf);
      }
    }
  };

  const getSprite = (name: string) => {
    //match base pokesprite syntax
    let tempName = name
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
      if (tempName.includes(target)) {
        return tempName
          .replace(target, replacement)
          .replace(
            /^([^-\s]+)-(.*)$/,
            (match, first, rest) => `${rest}-${first}`
          );
      }
    }

    return tempName;
  };

  const getDesc = (ability: string, isHA: boolean) => {
    //specify HA in description / return not found
    return abilitydesc[ability]
      ? isHA
        ? `Hidden Ability: ${abilitydesc[ability]}`
        : abilitydesc[ability]
      : "Ability description not found";
  };

  const getMulti = (name: string, type: string[]) => {
    //deep copy from json
    let multi: multiType = JSON.parse(
      JSON.stringify(typechart.find((def) => def.type === "default")?.multi)
    );

    //multiply multi for dual types
    type.map((type) => {
      const tempMulti: multiType = JSON.parse(
        JSON.stringify(typechart.find((item) => item.type === type)?.multi)
      );
      Object.keys(tempMulti).forEach((key) => {
        multi[key] *= tempMulti[key];
      });
    });

    //check ability for multi
    if (name in activeAbility) {
      const amatch = abilitymulti.find(
        (item) => item.ability === activeAbility[name]
      );
      if (amatch) {
        const amulti: multiType = JSON.parse(JSON.stringify(amatch.multi));
        Object.keys(amulti).forEach((key) => {
          multi[key] *= amulti[key];
        });
      }
    }

    //split multi to weak/strong/immune
    const weak: multiType = {};
    const strong: multiType = {};
    const immune: multiType = {};
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

  const handleAbilityClick = (name: string, ability: string) => {
    setActiveAbility((prev) => ({ ...prev, [name]: ability }));
  };

  const handleAbilityHover = (name: string | null, ability: string | null) => {
    setHoverPokemon(name || null);
    setHoverAbility(ability || null);
  };

  const renderNavbar = () => {
    return (
      <nav className="navbar navbar-dark navbar-expand-lg">
        <div className="container-fluid">
          <a className="navbar-brand" href="https://github.com/Reown/seaking">
            Seaking
          </a>
          <ul className="navbar-nav ms-auto">
            <li className="nav-item me-3">
              Shiny Sprites
              <div className="form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  onChange={() => setShiny(!shiny)}
                />
              </div>
            </li>
            <li className="nav-item">
              Revert Gen 1-5 Fairy
              <div className="form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  onChange={() => setFairy(!fairy)}
                />
              </div>
            </li>
          </ul>
        </div>
      </nav>
    );
  };

  const renderPoke = (found: pokedexType) => {
    return (
      <div className="card-body">
        <div className="row">
          <div className="col">
            {found.type.map((type) => (
              <div className={`${type} sub`}>{type}</div>
            ))}
          </div>
          <div className="col sprite">
            <span
              className={`pokesprite pokemon ${getSprite(found.name)} ${
                shiny ? "shiny" : ""
              }`}
            />
          </div>
          <div
            className="col name"
            onClick={() => {
              console.log(activeAbility);
            }}
          >
            {found.name}
          </div>
          <div className="col">
            {found.ability.map((ability, index, array) => {
              //check if is hidden ability, > 1 & last
              const isHA = index > 0 && index === array.length - 1;
              const isSelected = activeAbility[found.name] === ability;

              return (
                <div
                  className={`ability sub ${isSelected ? "selected" : ""}`}
                  onClick={() => {
                    handleAbilityClick(found.name, ability);
                  }}
                  onMouseEnter={() => {
                    handleAbilityHover(found.name, ability);
                  }}
                  onMouseLeave={() => {
                    handleAbilityHover(null, null);
                  }}
                >
                  {isHA ? `HA: ${ability}` : ability}
                  {hoverAbility === ability && hoverPokemon === found.name && (
                    <div className="hover">{getDesc(ability, isHA)}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMulti = (name: string, type: string[]) => {
    const [weak, strong, immune] = getMulti(name, type);

    return (
      <div className="card-body">
        {Object.keys(weak).length > 0 && (
          <>
            <div className="weaklabel">
              Super Effective
              <div className="row g-0 weak">
                {Object.keys(weak).map((key) => (
                  <div className={`${key} col`}>
                    {key}
                    <br />
                    {weak[key]}x
                  </div>
                ))}
              </div>
            </div>
            <br />
          </>
        )}
        {Object.keys(strong).length > 0 && (
          <>
            <div className="stronglabel">
              Not Very Effective
              <div className="row g-0 strong">
                {Object.keys(strong).map((key) => (
                  <div className={`${key} col`}>
                    {key}
                    <br />
                    {strong[key]}x
                  </div>
                ))}
              </div>
            </div>
            <br />
          </>
        )}
        {Object.keys(immune).length > 0 && (
          <>
            <div className="immunelabel">
              Immune
              <div className="row g-0 strong">
                {Object.keys(immune).map((key) => (
                  <div className={`${key} col`}>{key}</div>
                ))}
              </div>
            </div>
            <br />
          </>
        )}
      </div>
    );
  };

  const renderNavTab = (name: string, isDefault: boolean) => {
    return (
      <li className="nav-item">
        <button
          className={`nav-link ${isDefault ? "active" : ""}`}
          data-bs-toggle="tab"
          data-bs-target={`#${name.replace(/[\s']+/g, "-")}`}
          aria-selected={`${isDefault ? "true" : "false"}`}
        >
          {name}
        </button>
      </li>
    );
  };

  const renderTabContent = (found: pokedexType, isDefault: boolean) => {
    return (
      <div
        className={`tab-pane fade ${isDefault ? "show active" : ""}`}
        id={`${found.name.replace(/[\s']+/g, "-")}`}
      >
        {renderPoke(found)}
        {renderMulti(found.name, found.type)}
      </div>
    );
  };

  return (
    <>
      {renderNavbar()}
      <div className="search">
        <textarea
          maxLength={18}
          placeholder="Search"
          className="text"
          onChange={(e) => {
            getPokemon(e.target.value);
          }}
        />
      </div>
      {found.map((found) => {
        //check for regional forms with id
        const rmatch = regionaldex.filter((item) => item.id === found.id);
        const hasRegional = rmatch.length > 0;

        return (
          <>
            <hr />
            <div className="card mx-auto">
              {hasRegional ? (
                <>
                  <ul className="nav nav-tabs">
                    {renderNavTab(found.name, true)}
                    {rmatch.map((item) => renderNavTab(item.name, false))}
                  </ul>
                  <div className="tab-content">
                    {renderTabContent(found, true)}
                    {rmatch.map((item) => renderTabContent(item, false))}
                  </div>
                </>
              ) : (
                <>
                  {renderPoke(found)}
                  {renderMulti(found.name, found.type)}
                </>
              )}
            </div>
          </>
        );
      })}
    </>
  );
}

export default App;
