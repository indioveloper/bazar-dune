import React from "react";
import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

const API_URL = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");
const setToken = (token) => localStorage.setItem("token", token);
const removeToken = () => localStorage.removeItem("token");
const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};
const setUser = (user) => localStorage.setItem("user", JSON.stringify(user));
const removeUser = () => localStorage.removeItem("user");

const fetchAPI = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error en la petición");
  }

  return data;
};

const Header = ({ user, onLogout, onShowLogin, onShowProfile }) => (
  <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-white/10 dark:border-b-[#233f48] px-4 sm:px-10 lg:px-20 py-3 sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm z-10">
    <div className="flex items-center gap-4 text-gray-800 dark:text-white">
      <div className="size-6 text-primary">
        <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
            fill="currentColor"
          ></path>
        </svg>
      </div>
      <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
        Bazar Dune
      </h2>
    </div>
    <div className="flex items-center gap-4">
      {user ? (
        <React.Fragment>
          <div className="hidden md:flex items-center gap-4 text-sm">
            <button
              onClick={onShowProfile}
              className="text-gray-900 dark:text-white font-medium hover:text-primary transition-colors"
            >
              {user.username}
            </button>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
          >
            Cerrar Sesión
          </button>
        </React.Fragment>
      ) : (
        <button
          onClick={onShowLogin}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Iniciar Sesión
        </button>
      )}
    </div>
  </header>
);

const LoginModal = ({ onClose, onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("");
  const [region, setRegion] = useState("");
  const [serverSearch, setServerSearch] = useState("");
  const [servers, setServers] = useState([]);
  const [showServerSuggestions, setShowServerSuggestions] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isRegister ? "/auth/register" : "/auth/login";
      const body = isRegister
        ? { username, email, password, server, region }
        : { email, password };

      const data = await fetchAPI(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setToken(data.token);
      setUser(data.user);
      onLogin(data.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#111e22] rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRegister ? "Crear Cuenta" : "Iniciar Sesión"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <section>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Región
                </label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {[
                    "Europe",
                    "North America",
                    "South America",
                    "Asia",
                    "Oceania",
                  ].map((reg) => (
                    <label
                      key={reg}
                      className="flex items-center gap-2 p-2 border border-gray-300 dark:border-white/10 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                    >
                      <input
                        type="radio"
                        name="region"
                        value={reg}
                        checked={region === reg}
                        onChange={(e) => setRegion(e.target.value)}
                        className="text-primary"
                        required
                      />
                      <span className="text-sm text-gray-900 dark:text-white">
                        {reg}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Servidor
                </label>
                <input
                  type="text"
                  value={serverSearch}
                  onChange={(e) => {
                    setServerSearch(e.target.value);
                    setShowServerSuggestions(true);
                  }}
                  onFocus={() => setShowServerSuggestions(true)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Buscar servidor..."
                  required
                />
                {showServerSuggestions && serverSearch && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#111e22] border border-gray-300 dark:border-white/10 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {[
                      "Aiglon",
                      "Andromeda",
                      "Chapterhouse",
                      "Eumenes",
                      "Gansireed",
                      "Helios",
                      "Horologium",
                      "Ipyr",
                      "Lacerta",
                      "Laurrant",
                      "Lothar",
                      "Molitor",
                      "Niveus",
                      "Ostara",
                      "Persephone",
                      "Remus",
                      "Richese",
                      "Salusa Secundus",
                      "Shamal",
                      "Tantalus",
                      "Thule",
                      "Actaeon",
                      "Batigh",
                      "Calypso",
                      "Circinus",
                      "Ghanima",
                      "Hicetas",
                      "Karna",
                      "Leto",
                      "Mihna",
                      "Orion",
                      "Phaedra",
                      "Porthos",
                      "Rossak",
                      "Suk Alusus",
                      "Archidamas III",
                      "Bahamonde",
                      "Deneb",
                      "Buzzell",
                      "Canopus",
                      "Centaurus",
                      "Corona Borealis",
                      "Daedros",
                      "Eluzai",
                      "Galacia",
                      "Grumman",
                      "Icarus",
                      "Khala",
                      "Limos",
                      "Pax",
                      "Puppis",
                      "Rhea",
                      "Selene",
                      "Solaria",
                      "Alpha Corvus",
                      "Cassiopeia",
                      "Daxos",
                      "Epsilon Eridani",
                      "Fides",
                      "Hagal",
                      "Indra",
                      "Jongleur",
                      "Korona",
                      "Lampadas",
                      "Mycenae",
                      "Oxylon",
                      "Quirinus",
                      "Saturnia",
                      "Tucana",
                      "Xenophon",
                      "Dione",
                      "Jansine",
                      "Lynx",
                      "Menelaus",
                      "Nereus",
                      "Octans",
                      "Pisces",
                      "Volans",
                      "Aquarius",
                      "Arkon",
                      "Cycliadas",
                      "Martijoz",
                      "Numenor",
                      "Serpens",
                      "Terminus",
                    ]
                      .filter((s) =>
                        s.toLowerCase().includes(serverSearch.toLowerCase())
                      )
                      .map((srv, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            setServer(srv);
                            setServerSearch(srv);
                            setShowServerSuggestions(false);
                          }}
                          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer text-gray-900 dark:text-white"
                        >
                          {srv}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </section>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
              placeholder="Tu contraseña"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? isRegister
                ? "Creando cuenta..."
                : "Iniciando..."
              : isRegister
              ? "Crear Cuenta"
              : "Iniciar Sesión"}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-sm text-primary hover:underline"
            >
              {isRegister
                ? "¿Ya tienes cuenta? Inicia sesión"
                : "¿No tienes cuenta? Regístrate"}
            </button>
          </div>

          {!isRegister && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Demo: stilgar@fremen.dune / password123
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

const Autocomplete = ({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder,
  label,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (e) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelect = (item) => {
    onSelect(item);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
        placeholder={placeholder}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#111e22] border border-gray-300 dark:border-white/10 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSelect(item)}
              className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer text-gray-900 dark:text-white"
            >
              {typeof item === "string" ? item : item.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateItemPage = ({ user, onClose, onItemCreated }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogItems, setCatalogItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [price, setPrice] = useState("");
  const [regionSearch, setRegionSearch] = useState("");
  const [regions, setRegions] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(
    (user && user.region) || ""
  );
  const [serverSearch, setServerSearch] = useState("");
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState(
    (user && user.server) || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  console.log("Usuario completo:", JSON.stringify(user, null, 2));
  console.log("Region del usuario:", user && user.region);
  console.log("Server del usuario:", user && user.server);
  console.log("selectedRegion actual:", selectedRegion);
  console.log("selectedServer actual:", selectedServer);

  useEffect(() => {
    loadServersList();
  }, []);

  const loadServers = async () => {
    try {
      const data = await fetchAPI("/servers");
      setServers(data.servers);
    } catch (err) {
      console.error("Error loading servers:", err);
    }
  };

  const handleServerSearch = (value) => {
    setServerSearch(value);
    setServer(value);
    setShowServerSuggestions(true);
  };

  const handleLoginServerSelect = (selectedServer) => {
    setServer(selectedServer);
    setServerSearch(selectedServer);
    setShowServerSuggestions(false);
  };

  useEffect(() => {
    if (searchQuery.length > 0) {
      searchCatalog(searchQuery);
    }
  }, [searchQuery]);

  const loadRegions = async () => {
    try {
      const data = await fetchAPI("/regions");
      setRegions(data.regions);
    } catch (err) {
      console.error("Error loading regions:", err);
    }
  };

  const loadServersList = async () => {
    try {
      const data = await fetchAPI("/servers");
      setServers(data.servers);
    } catch (err) {
      console.error("Error loading servers:", err);
    }
  };

  const searchCatalog = async (query) => {
    try {
      const data = await fetchAPI(
        `/items-catalog?search=${encodeURIComponent(query)}`
      );
      setCatalogItems(data.items);
    } catch (err) {
      console.error("Error searching catalog:", err);
    }
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setSearchQuery(item.name);
    setCatalogItems([]);
  };

  const handleRegionSelect = (region) => {
    setSelectedRegion(region);
    setRegionSearch(region);
  };

  const handleServerSelect = (server) => {
    setSelectedServer(server);
    setServerSearch(server);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedItem || !price || !selectedRegion || !selectedServer) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await fetchAPI("/items", {
        method: "POST",
        body: JSON.stringify({
          name: selectedItem ? selectedItem.name : searchQuery,
          price: parseInt(price),
          imageUrl: selectedItem
            ? selectedItem.imageUrl
            : "https://via.placeholder.com/150",
          largeImageUrl: selectedItem
            ? selectedItem.imageUrl
            : "https://via.placeholder.com/150",
          description: selectedItem
            ? `${selectedItem.name} - ${selectedItem.type}`
            : searchQuery,
          tier: selectedItem ? parseInt(selectedItem.tier) : 1,
          type: selectedItem ? selectedItem.type : "Otros",
          region: selectedRegion,
          server: selectedServer,
          stock: 1,
        }),
      });

      setSuccess("¡Artículo publicado exitosamente!");
      setTimeout(() => {
        onItemCreated();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRegions = regions.filter((r) =>
    r.toLowerCase().includes(regionSearch.toLowerCase())
  );

  const filteredServers = servers.filter((s) =>
    s.toLowerCase().includes(serverSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#111e22] rounded-lg p-6 max-w-2xl w-full my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Publicar Artículo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Autocomplete
            value={searchQuery}
            onChange={setSearchQuery}
            onSelect={handleItemSelect}
            suggestions={catalogItems}
            placeholder="Buscar artículo..."
            label="Artículo"
          />

          {selectedItem && (
            <div className="p-4 border border-primary/20 rounded-lg bg-primary/5">
              <div className="flex items-center gap-4">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-16 h-16 object-contain bg-white/50 dark:bg-white/10 rounded-lg p-2"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {selectedItem.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tier {selectedItem.tier} • {selectedItem.type}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Precio (Solari)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
              placeholder="1000"
              min="1"
              required
            />
          </div>

          {/* Región auto-completada desde el usuario: {user && user.region} */}

          {/* Servidor auto-completado desde el usuario: {user?.server} */}

          {selectedItem && price && selectedRegion && selectedServer && (
            <div className="p-4 border-2 border-primary rounded-lg bg-primary/10">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Vista previa:
              </h4>
              <div className="flex items-center gap-4">
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.name}
                  className="w-12 h-12 object-contain bg-white/50 dark:bg-white/10 rounded-lg p-1"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {selectedItem.name}
                  </h3>
                  <p className="text-primary font-bold text-lg">
                    {price} Solari
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {selectedRegion} • {selectedServer}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Vendido por: {user.username}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-500 text-sm">
              {success}
            </div>
          )}

          <button
            disabled={loading || !searchQuery.trim() || !price}
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Publicando..." : "Publicar Artículo"}
          </button>
        </form>
      </div>
    </div>
  );
};

const SandConverter = () => {
  const [volume, setVolume] = useState("");
  const [sand, setSand] = useState(0);
  const [melange, setMelange] = useState(0);
  const [residue, setResidue] = useState(0);
  const [persons, setPersons] = useState(1);

  const calculate = (volumeValue, numPersons) => {
    const vol = parseFloat(volumeValue) || 0;
    const people = parseInt(numPersons) || 1;

    const sandResult = vol * (75000 / 11250);
    const melangeResult = sandResult * (200 / 10000);
    const residueResult = melangeResult * 5;

    setSand(Math.floor(sandResult));
    setMelange(Math.floor(melangeResult));
    setResidue(Math.floor(residueResult));
  };

  const handleVolumeChange = (e) => {
    const value = e.target.value;
    setVolume(value);
    calculate(value, persons);
  };

  const handlePersonsChange = (e) => {
    const value = e.target.value;
    setPersons(value);
    calculate(volume, value);
  };

  const fillExample = () => {
    setVolume("11250");
    calculate("11250", persons);
  };

  return (
    <div className="bg-white dark:bg-[#111e22] rounded-lg p-6 border border-gray-200 dark:border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <img
          src="https://i.postimg.cc/pd3WBMzQ/ai-generated-image-1765363275610.png"
          alt="Conversión de arena"
          className="w-16 h-16 object-contain"
        />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Conversor de Arena
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Volumen de Arena
          </label>
          <input
            type="number"
            value={volume}
            onChange={handleVolumeChange}
            placeholder="11250"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-lg focus:border-primary focus:outline-none"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Número de Personas
          </label>
          <input
            type="number"
            value={persons}
            onChange={handlePersonsChange}
            placeholder="1"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-lg focus:border-primary focus:outline-none"
            min="1"
          />
        </div>

        <div className="space-y-3">
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                Arena de Especia (items)
              </span>
              <span className="text-primary text-2xl font-bold">{sand}</span>
            </div>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                Melange
              </span>
              <span className="text-orange-400 text-2xl font-bold">
                {melange}
              </span>
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                Residuo
              </span>
              <span className="text-purple-400 text-2xl font-bold">
                {residue}
              </span>
            </div>
          </div>
        </div>

        {persons > 1 && (melange > 0 || residue > 0) && (
          <div className="bg-gray-100 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Por persona ({persons} jugadores):
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Melange:</span>
                <span className="font-bold text-orange-400">
                  {Math.floor(melange / persons)}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Residuo:</span>
                <span className="font-bold text-purple-400">
                  {Math.floor(residue / persons)}
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={fillExample}
          className="w-full px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10 rounded-lg text-gray-700 dark:text-gray-300 text-sm transition-colors"
        >
          Ejemplo: 11250 volumen
        </button>

        <div className="pt-4 border-t border-gray-200 dark:border-white/10">
          <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Fórmulas:
          </h4>
          <div className="text-xs text-gray-400 dark:text-gray-500 space-y-1">
            <p>• Arena = Volumen × (75000 ÷ 11250)</p>
            <p>• Melange = Arena × (200 ÷ 10000)</p>
            <p>• Residuo = Melange × 5</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ItemCard = ({ item, isSelected, onClick }) => (
  <div
    onClick={() => onClick(item)}
    className={`flex items-center gap-4 px-4 py-3 cursor-pointer rounded-lg transition-colors border ${
      isSelected
        ? "bg-primary/10 dark:bg-primary/20 border-primary"
        : "bg-white dark:bg-[#111e22] hover:bg-gray-100 dark:hover:bg-white/5 border-gray-200 dark:border-white/10"
    }`}
  >
    <img
      alt={item.name}
      className="size-10 object-contain p-1 bg-white/50 dark:bg-white/10 rounded-md"
      src={item.imageUrl}
    />
    <div className="flex-1">
      <p className="text-gray-900 dark:text-white text-c font-medium leading-normal">
        {item.name}
      </p>
      <p className="text-gray-600 dark:text-[#92bbc9] text-sm font-normal leading-normal">
        Precio: {item.price} Solari
      </p>
    </div>
  </div>
);

const ItemDetail = ({ item, user }) => {
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAmount, setOfferAmount] = useState(item ? item.price : 0);
  const [offerMessage, setOfferMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  if (!item) return null;

  const handleOfferSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("Debes iniciar sesión para hacer una oferta");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await fetchAPI("/offers", {
        method: "POST",
        body: JSON.stringify({
          itemId: item.id,
          amount: parseInt(offerAmount),
          message: offerMessage,
        }),
      });

      setSuccess("¡Oferta enviada exitosamente!");
      setTimeout(() => {
        setShowOfferModal(false);
        setSuccess("");
        setOfferMessage("");
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className="w-full lg:w-1/3 lg:sticky top-24 self-start">
      <div className="flex flex-col gap-6 p-6 rounded-lg bg-white dark:bg-[#111e22] border border-gray-200 dark:border-white/10">
        <div className="flex flex-col gap-4">
          <div className="w-full bg-center bg-no-repeat aspect-[4/3] bg-cover rounded-lg bg-gray-100 dark:bg-white/5">
            <div
              className="w-full h-full bg-center bg-no-repeat bg-contain"
              style={{ backgroundImage: `url("${item.largeImageUrl}")` }}
            ></div>
          </div>
          <div className="flex justify-between items-start gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {item.name}
            </h2>
            <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-bold">
              Tier {item.tier}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Descripción
            </p>
            <p className="text-base text-gray-800 dark:text-gray-200">
              {item.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Tipo
              </p>
              <p className="text-base text-gray-800 dark:text-gray-200">
                {item.type}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Stock
              </p>
              <p className="text-base text-gray-800 dark:text-gray-200">
                {item.stock}
              </p>
            </div>
          </div>

          {item.seller && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Vendedor
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className="size-8 rounded-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${item.seller.avatar}')` }}
                ></div>
                <div>
                  <p className="text-base font-medium text-gray-800 dark:text-gray-200">
                    {item.seller.username}
                  </p>
                  {item.server && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Servidor: {item.server}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
          <div className="text-3xl font-bold text-primary">
            {item.price} Solari
          </div>

          <button
            onClick={() => setShowOfferModal(true)}
            disabled={!user}
            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-xl">
              price_check
            </span>
            <span>
              {user ? "Emitir una oferta" : "Inicia sesión para ofertar"}
            </span>
          </button>
        </div>

        {showOfferModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-[#111e22] rounded-lg p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Hacer Oferta
                </h3>
                <button
                  onClick={() => setShowOfferModal(false)}
                  className="text-gray-500"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleOfferSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cantidad (Solari)
                  </label>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                    rows="3"
                    placeholder="Añade un mensaje al vendedor..."
                  />
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-500 text-sm">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {loading ? "Enviando..." : "Enviar Oferta"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// Componente de Perfil de Usuario
const UserProfile = ({ user, onClose }) => {
  const [activeSection, setActiveSection] = useState("items");
  const [myItems, setMyItems] = useState([]);
  const [offers, setOffers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeSection]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeSection === "items") {
        const itemsData = await fetchAPI("/my-items");
        setMyItems(itemsData.items);

        const statsData = await fetchAPI("/sales-stats");
        setStats(statsData);
      } else if (activeSection === "offers") {
        const offersData = await fetchAPI("/offers/my-offers?type=received");
        setOffers(offersData.offers);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async (offerId) => {
    try {
      await fetchAPI(`/offers/${offerId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "accepted" }),
      });
      loadData();
    } catch (err) {
      alert("Error al aceptar oferta: " + err.message);
    }
  };

  const handleRejectOffer = async (offerId) => {
    try {
      await fetchAPI(`/offers/${offerId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "rejected" }),
      });
      loadData();
    } catch (err) {
      alert("Error al rechazar oferta: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#111e22] rounded-lg p-6 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mi Perfil
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-white/10">
          <button
            onClick={() => setActiveSection("items")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeSection === "items"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Mis Ventas
          </button>
          <button
            onClick={() => setActiveSection("offers")}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeSection === "offers"
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Ofertas Recibidas
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : (
          <React.Fragment>
            {/* Sección de Items */}
            {activeSection === "items" && (
              <div className="space-y-6">
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Items
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {stats.totalItems}
                      </p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Activos
                      </p>
                      <p className="text-2xl font-bold text-green-500">
                        {stats.activeItems}
                      </p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Vendidos
                      </p>
                      <p className="text-2xl font-bold text-blue-500">
                        {stats.soldItems}
                      </p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ofertas Pendientes
                      </p>
                      <p className="text-2xl font-bold text-orange-500">
                        {stats.pendingOffers}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {myItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No tienes items publicados
                    </p>
                  ) : (
                    myItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-16 h-16 object-contain bg-white/50 dark:bg-white/10 rounded-lg p-2"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {item.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.price} Solari
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            item.status === "available"
                              ? "bg-green-500/20 text-green-500"
                              : "bg-gray-500/20 text-gray-500"
                          }`}
                        >
                          {item.status === "available"
                            ? "Disponible"
                            : "Vendido"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Sección de Ofertas */}
            {activeSection === "offers" && (
              <div className="space-y-4">
                {offers.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No tienes ofertas recibidas
                  </p>
                ) : (
                  offers.map((offer) => (
                    <div
                      key={offer.id}
                      className="p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10"
                    >
                      <div className="flex items-start gap-4">
                        {offer.item && (
                          <img
                            src={offer.item.imageUrl}
                            alt={offer.item.name}
                            className="w-16 h-16 object-contain bg-white/50 dark:bg-white/10 rounded-lg p-2"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white">
                                {offer.item
                                  ? offer.item.name
                                  : "Item eliminado"}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Por:{" "}
                                {offer.buyer
                                  ? offer.buyer.username
                                  : "Usuario desconocido"}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                offer.status === "pending"
                                  ? "bg-orange-500/20 text-orange-500"
                                  : offer.status === "accepted"
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-red-500/20 text-red-500"
                              }`}
                            >
                              {offer.status === "pending"
                                ? "Pendiente"
                                : offer.status === "accepted"
                                ? "Aceptada"
                                : "Rechazada"}
                            </span>
                          </div>

                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-2">
                            <p className="text-primary font-bold text-lg">
                              {offer.amount} Solari
                            </p>
                          </div>

                          {offer.message && (
                            <div className="bg-white dark:bg-white/5 rounded-lg p-3 mb-3">
                              <p className="text-sm text-gray-700 dark:text-gray-300">
                                {offer.message}
                              </p>
                            </div>
                          )}

                          {offer.status === "pending" && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptOffer(offer.id)}
                                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
                              >
                                Aceptar
                              </button>
                              <button
                                onClick={() => handleRejectOffer(offer.id)}
                                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors font-medium"
                              >
                                Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUserState] = useState(getUser());
  const [showLogin, setShowLogin] = useState(false);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("marketplace");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTier, setFilterTier] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [itemTypes, setItemTypes] = useState([]);
  const [selectedServer, setSelectedServer] = useState(
    (user && user.server) || ""
  );
  const [servers, setServers] = useState([]);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchAPI("/items");
      setItems(data.items);

      const types = [...new Set(data.items.map((item) => item.type))]
        .filter(Boolean)
        .sort();
      setItemTypes(types);

      // Cargar servidores únicos
      const serverList = [...new Set(data.items.map((item) => item.server))]
        .filter(Boolean)
        .sort();
      setServers(serverList);

      if (data.items.length > 0) {
        setSelectedItem(data.items[0]);
      }
    } catch (err) {
      setError("Error al cargar los artículos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUserState(userData);
  };

  const handleLogout = () => {
    removeToken();
    removeUser();
    setUserState(null);
  };

  const handleItemCreated = () => {
    loadItems();
  };

  const filteredItems = items.filter((item) => {
    // Filtro por servidor (obligatorio, excepto si es "ALL")
    if (
      selectedServer &&
      selectedServer !== "ALL" &&
      item.server !== selectedServer
    ) {
      return false;
    }
    if (
      searchTerm &&
      !item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    if (filterTier && item.tier.toString() !== filterTier) {
      return false;
    }
    if (filterType && item.type !== filterType) {
      return false;
    }
    if (filterMaxPrice && item.price > parseInt(filterMaxPrice)) {
      return false;
    }
    return true;
  });

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <Header
          user={user}
          onLogout={handleLogout}
          onShowLogin={() => setShowLogin(true)}
          onShowProfile={() => setShowProfile(true)}
        />

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2 px-4">
                <span className="text-gray-500 dark:text-[#92bbc9] text-sm font-medium">
                  Inicio
                </span>
                <span className="text-gray-500 dark:text-[#92bbc9] text-sm font-medium">
                  /
                </span>
                <span className="text-gray-900 dark:text-white text-sm font-medium">
                  {activeTab === "marketplace" ? "Marketplace" : "Herramientas"}
                </span>
              </div>

              <div className="flex flex-wrap justify-between gap-3 px-4 items-center">
                <h1 className="text-gray-900 dark:text-white text-4xl font-black leading-tight">
                  {activeTab === "marketplace" ? "Bazar Dune" : "Herramientas"}
                </h1>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("marketplace")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === "marketplace"
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Marketplace
                  </button>
                  <button
                    onClick={() => setActiveTab("tools")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeTab === "tools"
                        ? "bg-primary text-white"
                        : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Herramientas
                  </button>
                  {user && activeTab === "marketplace" && (
                    <button
                      onClick={() => setShowCreateItem(true)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-xl">
                        add
                      </span>
                      <span>Vender Artículo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {activeTab === "marketplace" ? (
                <React.Fragment>
                  <div className="w-full lg:w-2/3 flex flex-col gap-6">
                    {/* Selector de Servidor */}
                    <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Selecciona tu servidor para ver items disponibles:
                      </label>
                      <select
                        value={selectedServer}
                        onChange={(e) => setSelectedServer(e.target.value)}
                        className="w-full px-4 py-3 bg-white dark:bg-[#1a2f38] border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-lg font-medium"
                        style={{ colorScheme: "dark" }}
                      >
                        <option
                          value=""
                          className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                        >
                          -- Selecciona un servidor --
                        </option>
                        <option
                          value="ALL"
                          className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                        >
                          Ver todos los servidores
                        </option>
                        {servers.map((srv) => (
                          <option
                            key={srv}
                            value={srv}
                            className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                          >
                            {srv}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedServer && (
                      <React.Fragment>
                        {/* Filtros */}
                        <div className="bg-white dark:bg-[#111e22] rounded-lg p-4 border border-gray-200 dark:border-white/10">
                          <div className="space-y-4">
                            <div>
                              <input
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Tier
                                </label>
                                <select
                                  value={filterTier}
                                  onChange={(e) =>
                                    setFilterTier(e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a2f38] border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                                  style={{ colorScheme: "dark" }}
                                >
                                  <option
                                    value=""
                                    className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                                  >
                                    Todos
                                  </option>
                                  <option
                                    value="1"
                                    className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                                  >
                                    Tier 1
                                  </option>
                                  <option
                                    value="2"
                                    className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                                  >
                                    Tier 2
                                  </option>
                                  <option
                                    value="3"
                                    className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                                  >
                                    Tier 3
                                  </option>
                                  <option
                                    value="4"
                                    className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                                  >
                                    Tier 4
                                  </option>
                                  <option
                                    value="5"
                                    className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                                  >
                                    Tier 5
                                  </option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Tipo
                                </label>
                                <select
                                  value={filterType}
                                  onChange={(e) =>
                                    setFilterType(e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#1a2f38] border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                                  style={{ colorScheme: "dark" }}
                                >
                                  <option
                                    value=""
                                    className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                                  >
                                    Todos
                                  </option>
                                  {itemTypes.map((type) => (
                                    <option
                                      key={type}
                                      value={type}
                                      className="bg-white dark:bg-[#1a2f38] text-gray-900 dark:text-white"
                                    >
                                      {type}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Precio máximo
                                </label>
                                <input
                                  type="number"
                                  placeholder="Sin límite"
                                  value={filterMaxPrice}
                                  onChange={(e) =>
                                    setFilterMaxPrice(e.target.value)
                                  }
                                  className="w-full px-3 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
                                  min="0"
                                />
                              </div>
                            </div>

                            {(searchTerm ||
                              filterTier ||
                              filterType ||
                              filterMaxPrice) && (
                              <button
                                onClick={() => {
                                  setSearchTerm("");
                                  setFilterTier("");
                                  setFilterType("");
                                  setFilterMaxPrice("");
                                }}
                                className="text-sm text-primary hover:underline"
                              >
                                Limpiar filtros
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Lista de items */}
                        <div className="flex flex-col">
                          {filteredItems.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                              {items.length === 0
                                ? "No hay artículos disponibles"
                                : "No se encontraron artículos con esos filtros"}
                            </div>
                          ) : (
                            <React.Fragment>
                              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                                {filteredItems.length} artículo
                                {filteredItems.length !== 1 ? "s" : ""}{" "}
                                encontrado
                                {filteredItems.length !== 1 ? "s" : ""}
                              </div>
                              {filteredItems.map((item) => (
                                <ItemCard
                                  key={item.id}
                                  item={item}
                                  isSelected={
                                    selectedItem && selectedItem.id === item.id
                                  }
                                  onClick={setSelectedItem}
                                />
                              ))}
                            </React.Fragment>
                          )}
                        </div>
                      </React.Fragment>
                    )}
                  </div>

                  {selectedItem && (
                    <ItemDetail item={selectedItem} user={user} />
                  )}
                </React.Fragment>
              ) : (
                <div className="w-full space-y-6">
                  <SandConverter />
                  <div className="bg-white dark:bg-[#111e22] rounded-lg p-6 border border-gray-200 dark:border-white/10 text-center text-gray-500 dark:text-gray-400">
                    <p className="text-sm">Más herramientas próximamente...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onLogin={handleLogin} />
      )}

      {showCreateItem && user && (
        <CreateItemPage
          user={user}
          onClose={() => setShowCreateItem(false)}
          onItemCreated={handleItemCreated}
        />
      )}

      {showProfile && user && (
        <UserProfile user={user} onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(<App />);
