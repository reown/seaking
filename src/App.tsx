import { useEffect, useState } from "react";
import { getSprite, getDesc, getMulti } from "./helper";
import pokedexData from "./data/pokedex.json";
import nofairydexData from "./data/nofairydex.json";
import altformdexData from "./data/altformdex.json";
import abilityMultiData from "./data/abilitymulti.json";
import "./css/App.css";
import "./css/Type.css";

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

interface AbilityMultiMap {
  ability: string;
  multi: Partial<Record<string, number>>;
}

type ActiveAbilityMap = Record<string, string>;

const pokedex: PokedexMap[] = pokedexData;
const nofairydex: PokedexMap[] = nofairydexData;
const altformdex: AltformdexMap[] = altformdexData;
const abilityMulti: AbilityMultiMap[] = abilityMultiData;

function App() {
  const [query, setQuery] = useState<string>("");
  const [found, setFound] = useState<PokedexMap[]>([]);
  const [fairy, setFairy] = useState<boolean>(false);
  const [shiny, setShiny] = useState<boolean>(false);
  const [hoverAbility, setHoverAbility] = useState<string | null>(null);
  const [hoverPokemon, setHoverPokemon] = useState<string | null>(null);
  const [activeAbility, setActiveAbility] = useState<ActiveAbilityMap>({});

  useEffect(() => {
    getPokemon(query);
  }, [fairy]);

  useEffect(() => {
    const defActive: ActiveAbilityMap = {};

    //check for ability that affects type chart
    found.forEach((found) => {
      const firstmatch = found.ability.find((item) =>
        abilityMulti.some((item2) => item === item2.ability)
      );
      if (firstmatch) {
        defActive[found.name] = firstmatch;
      }
    });

    //sets avtive ability & don't replace known active
    if (Object.keys(defActive).length > 0) {
      setActiveAbility((prev) => {
        const newState = { ...prev };
        Object.keys(defActive).forEach((key) => {
          if (!(key in newState)) {
            newState[key] = defActive[key];
          }
        });

        return newState;
      });
    }
  }, [found]);

  const getPokemon = (e: string) => {
    setQuery(e);
    setFound([]);

    //save active abilities until new search
    if (e.length < 3) {
      setActiveAbility({});
    }

    //search pokedex for names that includes substring
    if (e.length > 2) {
      const checkf = pokedex.filter((item) =>
        item.name.toLowerCase().includes(e.toLowerCase())
      );

      //check if fairy is toggled, replace from pokedex_nofairy
      if (fairy) {
        const checknf = checkf.map((item) => {
          const match = nofairydex.find((item2) => item.id === item2.id);

          return match ? match : item;
        });
        setFound(checknf);
      } else {
        setFound(checkf);
      }
    }
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
          <a className="navbar-brand" href="https://github.com/reown/seaking">
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
              Non-Fairy Version
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

  const renderPoke = (
    found: PokedexMap | AltformdexMap,
    activeAbility: string
  ) => {
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
              className={`pokesprite pokemon ${getSprite(
                "base" in found ? found.base : found.name,
                "tag" in found ? found.tag : ""
              )} ${shiny ? "shiny" : ""}`}
            />
          </div>
          <div className="col name">
            #{found.id}
            <br />
            {"base" in found ? found.base : found.name}
          </div>
          <div className="col">
            {found.ability.map((ability, index, array) => {
              //check if is hidden ability, > 1 & last
              const isHA = index > 0 && index === array.length - 1;
              const isSelected = activeAbility === ability;

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

  const renderMulti = (type: string[], activeAbility: string) => {
    const [weak, strong, immune] = getMulti(type, activeAbility);

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

  const renderTabContent = (found: PokedexMap, isDefault: boolean) => {
    return (
      <div
        className={`tab-pane fade ${isDefault ? "show active" : ""}`}
        id={`${found.name.replace(/[\s']+/g, "-")}`}
      >
        {renderPoke(found, activeAbility[found.name])}
        {renderMulti(found.type, activeAbility[found.name])}
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
        //check for alternate forms with id
        const rmatch = altformdex.filter((item) => item.id === found.id);
        const hasAlternate = rmatch.length > 0;

        return (
          <>
            <hr />
            <div className="card mx-auto">
              {hasAlternate ? (
                <>
                  <ul className="nav nav-tabs">
                    {rmatch.map((item, index) =>
                      renderNavTab(item.name, index === 0)
                    )}
                  </ul>
                  <div className="tab-content">
                    {rmatch.map((item, index) =>
                      renderTabContent(item, index === 0)
                    )}
                  </div>
                </>
              ) : (
                <>
                  {renderPoke(found, activeAbility[found.name])}
                  {renderMulti(found.type, activeAbility[found.name])}
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
