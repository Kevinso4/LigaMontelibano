import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import {
    getFirestore, collection, onSnapshot, query, doc, setDoc, updateDoc, deleteDoc, addDoc, where, getDocs
} from 'firebase/firestore';
import { Home, Users, Newspaper, Swords, Award, Star, Settings, LogIn, X, Plus, Trash2, Edit3, MapPin, Zap, User, Target, RotateCcw } from 'lucide-react';

// --- CONFIGURACIÓN GLOBAL DE FIREBASE Y AUTH ---

// Variables globales proporcionadas por el entorno de Canvas (se usan para configurar Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyB4DrbupcSuMaw8aB0Nh2QzAtYsoWV6RmQ",
  authDomain: "ligamontelibano.firebaseapp.com",
  projectId: "ligamontelibano",
  storageBucket: "ligamontelibano.firebasestorage.app",
  messagingSenderId: "415715122405",
  appId: "1:415715122405:web:f1b428fe73d5c797f1880c",
  measurementId: "G-M2C78XXRCS"
};
// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Colección pública (para que todos los usuarios compartan los mismos datos)
const PUBLIC_COLLECTION_PATH = `/artifacts/${firebaseConfig.appId}/public/data`;

// Constantes de la Liga
const ADMIN_PASSWORD = 'montelibano2025';
const SUSPENSION_POINTS_THRESHOLD = 5; // 5 PS = Suspendido

// --- HOOK PARA AUTENTICACIÓN Y DATOS ---

const useLigaData = () => {
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [news, setNews] = useState([]);
    const [venues, setVenues] = useState([]);
    const [sponsors, setSponsors] = useState([]);

    // 1. Manejo de Autenticación
    useEffect(() => {
        const signInUser = async () => {
            try {
                if (initialAuthToken) {
                    const userCredential = await signInWithCustomToken(auth, initialAuthToken);
                    setCurrentUserId(userCredential.user.uid);
                } else {
                    const userCredential = await signInAnonymously(auth);
                    setCurrentUserId(userCredential.user.uid);
                }
            } catch (error) {
                console.error("Error al iniciar sesión en Firebase:", error);
            } finally {
                setIsAuthReady(true);
            }
        };
        signInUser();
    }, []);

    // 2. Escuchas de Firestore para datos públicos (Equipos, Noticias, Partidos, etc.)
    useEffect(() => {
        if (!isAuthReady) return;

        const unsubscribeTeams = onSnapshot(collection(db, PUBLIC_COLLECTION_PATH, 'teams'), (snapshot) => {
            try {
                const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeams(teamsData);
            } catch (error) {
                console.error("Error al obtener equipos de Firestore:", error);
            }
        });

        const unsubscribeMatches = onSnapshot(collection(db, PUBLIC_COLLECTION_PATH, 'matches'), (snapshot) => {
            try {
                const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMatches(matchesData);
            } catch (error) {
                console.error("Error al obtener partidos de Firestore:", error);
            }
        });

        const unsubscribeNews = onSnapshot(collection(db, PUBLIC_COLLECTION_PATH, 'news'), (snapshot) => {
            try {
                const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.timestamp - a.timestamp);
                setNews(newsData);
            } catch (error) {
                console.error("Error al obtener noticias de Firestore:", error);
            }
        });

        const unsubscribeVenues = onSnapshot(collection(db, PUBLIC_COLLECTION_PATH, 'venues'), (snapshot) => {
            try {
                const venuesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setVenues(venuesData);
            } catch (error) {
                console.error("Error al obtener canchas de Firestore:", error);
            }
        });

        const unsubscribeSponsors = onSnapshot(collection(db, PUBLIC_COLLECTION_PATH, 'sponsors'), (snapshot) => {
            try {
                const sponsorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSponsors(sponsorsData);
            } catch (error) {
                console.error("Error al obtener patrocinadores de Firestore:", error);
            }
        });


        return () => {
            unsubscribeTeams();
            unsubscribeMatches();
            unsubscribeNews();
            unsubscribeVenues();
            unsubscribeSponsors();
        };
    }, [isAuthReady]);

    return { teams, setTeams, matches, news, venues, setVenues, sponsors, setSponsors, currentUserId, isAuthReady };
};


// --- UTILIDADES DE DATOS ---
const formatFirestoreTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.seconds) return 'N/A';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('es-CO', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};

const getTeamNameById = (teams, id) => teams.find(t => t.id === id)?.name || 'Equipo Desconocido';
const getTeamById = (teams, id) => teams.find(t => t.id === id);

const getStatusColor = (status) => {
    switch (status) {
        case 'Finalizado': return 'bg-red-500';
        case 'En Vivo': return 'bg-green-500 animate-pulse';
        case 'Descanso': return 'bg-blue-500';
        default: return 'bg-gray-500';
    }
};

const POSITION_MAP = {
    GK: 'Portero (GK)',
    DF: 'Defensa (DF)',
    MF: 'Mediocampista (MF)',
    FW: 'Delantero (FW)',
    SU: 'Suplente (SU)',
};

const POSITIONS_ORDER = ['GK', 'DF', 'MF', 'FW', 'SU'];


// --- COMPONENTES MODALES (REUTILIZABLES) ---

const Modal = ({ isOpen, onClose, title, children, isLarge = false }) => {
    if (!isOpen) return null;

    const sizeClass = isLarge ? 'max-w-4xl' : 'max-w-lg';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className={`bg-gray-800 rounded-2xl shadow-2xl p-6 w-full ${sizeClass}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                    <h2 className="text-2xl font-bold text-yellow-400">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition">
                        <X size={24} />
                    </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

// --- MODAL DE ACCESO ADMINISTRADOR ---

const AdminLoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (password === ADMIN_PASSWORD) {
            setTimeout(() => {
                onLoginSuccess();
                onClose();
            }, 500);
        } else {
            setError('Clave incorrecta. Intenta de nuevo.');
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Iniciar Sesión como Administrador">
            <form onSubmit={handleLogin} className="space-y-4">
                <input
                    type="password"
                    placeholder="Clave de Administrador"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                    disabled={isLoading}
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button
                    type="submit"
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? 'Verificando...' : 'Acceder'}
                </button>
                <p className="text-center text-gray-400 text-sm">Clave de ejemplo: `{ADMIN_PASSWORD}`</p>
            </form>
        </Modal>
    );
};

// --- MODAL DE PERFIL DE JUGADOR ---

const PlayerProfileModal = ({ isOpen, onClose, teams, setTeams, currentUserId }) => {
    const [playerIdInput, setPlayerIdInput] = useState('');
    const [currentPlayer, setCurrentPlayer] = useState(null);
    const [teamId, setTeamId] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});
    const [error, setError] = useState('');
    const [searchPerformed, setSearchPerformed] = useState(false);

    const team = useMemo(() => teams.find(t => t.id === teamId), [teams, teamId]);
    const teamName = team ? team.name : 'N/A';

    const handleSearch = () => {
        setError('');
        setCurrentPlayer(null);
        setTeamId(null);
        setSearchPerformed(true);

        if (!playerIdInput) {
            setError('Ingresa un ID de Jugador válido.');
            return;
        }

        let foundPlayer = null;
        let foundTeamId = null;

        for (const t of teams) {
            foundPlayer = t.players?.find(p => p.playerId === playerIdInput);
            if (foundPlayer) {
                foundTeamId = t.id;
                break;
            }
        }

        if (foundPlayer) {
            setCurrentPlayer(foundPlayer);
            setTeamId(foundTeamId);
            setEditData({ number: foundPlayer.number || '', bio: foundPlayer.bio || '', profilePicUrl: foundPlayer.profilePicUrl || '' });
        } else {
            setError('ID de Jugador no encontrado.');
        }
    };

    const handleUpdate = async () => {
        if (!teamId || !currentPlayer) return;

        const playerIndex = team.players.findIndex(p => p.playerId === currentPlayer.playerId);
        if (playerIndex === -1) return;

        const updatedPlayers = [...team.players];
        updatedPlayers[playerIndex] = {
            ...currentPlayer,
            ...editData,
            number: parseInt(editData.number) || currentPlayer.number,
        };

        try {
            const teamRef = doc(db, PUBLIC_COLLECTION_PATH, 'teams', teamId);
            await updateDoc(teamRef, { players: updatedPlayers });

            // Actualizar estado local
            setTeams(teams.map(t => t.id === teamId ? { ...team, players: updatedPlayers } : t));
            setCurrentPlayer(updatedPlayers[playerIndex]);
            setIsEditing(false);
            alert('¡Perfil actualizado con éxito!');
        } catch (e) {
            console.error("Error al actualizar perfil del jugador: ", e);
            setError('Fallo al actualizar el perfil.');
        }
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Acceso a Perfil de Jugador" isLarge={true}>
            <div className="p-4 bg-gray-700 rounded-xl mb-6 shadow-inner">
                <p className="text-gray-300 mb-3">Introduce tu ID de Jugador para ver o actualizar tu perfil.</p>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        placeholder="ID de Jugador (ej: 1a2b3c4d)"
                        value={playerIdInput}
                        onChange={(e) => setPlayerIdInput(e.target.value)}
                        className="flex-grow p-3 bg-gray-600 text-white rounded-lg focus:ring-yellow-500 focus:outline-none"
                    />
                    <button
                        onClick={handleSearch}
                        className="bg-yellow-500 text-gray-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition duration-200"
                    >
                        Buscar
                    </button>
                </div>
                {error && <p className="text-red-400 mt-2 text-sm">{error}</p>}
            </div>

            {currentPlayer && (
                <div className="bg-gray-900 p-6 rounded-2xl shadow-xl border border-green-700/50">
                    <div className="flex items-start space-x-6">
                        <div className="flex-shrink-0">
                            <img
                                src={currentPlayer.profilePicUrl || 'https://placehold.co/120x120/10b981/ffffff?text=JUG'}
                                alt="Foto de Perfil"
                                className="w-28 h-28 rounded-full object-cover border-4 border-yellow-400 shadow-xl"
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/120x120/10b981/ffffff?text=JUG'; }}
                            />
                        </div>
                        <div className="flex-grow">
                            <h3 className="text-3xl font-extrabold text-white mb-1">{currentPlayer.name}</h3>
                            <p className="text-lg text-yellow-500 mb-2">Equipo: {teamName}</p>
                            <div className="flex flex-wrap gap-x-4 text-gray-300 text-sm">
                                <p><span className="font-semibold">Posición:</span> {POSITION_MAP[currentPlayer.position] || 'N/A'}</p>
                                <p><span className="font-semibold">No. Camiseta:</span> {currentPlayer.number || 'No asignado'}</p>
                                <p><span className="font-semibold">ID Secreto:</span> {currentPlayer.playerId}</p>
                                <p className="flex items-center"><span className="font-semibold mr-1">Suspendido:</span> {((currentPlayer.suspensionPoints || 0) >= SUSPENSION_POINTS_THRESHOLD) ? <span className="text-red-500 font-bold flex items-center"><Zap size={14} className="mr-1" /> SÍ</span> : 'NO'}</p>
                            </div>
                            <div className="flex space-x-4 mt-3">
                                <span className="text-lg bg-green-700 px-3 py-1 rounded-full"><span className="font-bold">{currentPlayer.goals || 0}</span> Goles</span>
                                <span className="text-lg bg-yellow-700 px-3 py-1 rounded-full"><span className="font-bold">{currentPlayer.yc || 0}</span> Amarillas</span>
                                <span className="text-lg bg-red-700 px-3 py-1 rounded-full"><span className="font-bold">{currentPlayer.rc || 0}</span> Rojas</span>
                            </div>
                            <p className="mt-4 text-gray-300 italic">{currentPlayer.bio || "Este jugador aún no ha escrito una biografía."}</p>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-gray-700 pt-6">
                        <h4 className="text-xl font-bold text-yellow-400 mb-3">
                            Gestión de Perfil
                            <button onClick={() => setIsEditing(!isEditing)} className="ml-4 text-sm text-green-500 hover:text-green-400 flex items-center">
                                <Edit3 size={16} className="mr-1" /> {isEditing ? 'Cancelar' : 'Editar Datos'}
                            </button>
                        </h4>
                        {isEditing && (
                            <div className="space-y-4 p-4 bg-gray-800 rounded-lg">
                                <input
                                    type="number"
                                    placeholder="Número de Camiseta"
                                    value={editData.number}
                                    onChange={(e) => setEditData({ ...editData, number: e.target.value })}
                                    className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-yellow-500"
                                />
                                <input
                                    type="url"
                                    placeholder="URL de Foto de Perfil (ej: https://imgur.com/foto.jpg)"
                                    value={editData.profilePicUrl}
                                    onChange={(e) => setEditData({ ...editData, profilePicUrl: e.target.value })}
                                    className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-yellow-500"
                                />
                                <textarea
                                    placeholder="Biografía o Frase (Máx. 150 caracteres)"
                                    value={editData.bio}
                                    onChange={(e) => setEditData({ ...editData, bio: e.target.value.substring(0, 150) })}
                                    rows="3"
                                    className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-yellow-500 resize-none"
                                />
                                <button
                                    onClick={handleUpdate}
                                    className="w-full bg-yellow-500 text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-600 transition duration-200"
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

// --- MODAL DE MARCADOR EN VIVO ---

const LiveScoreModal = ({ isOpen, onClose, match, teams, handleUpdateMatchScore, isLoggedIn }) => {
    if (!isOpen || !match) return null;

    const [scoreB, setScoreB] = useState(match.scoreB || 0);
    const [status, setStatus] = useState(match.status);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const teamA = teams.find(t => t.id === match.teamAId);
    const teamB = teams.find(t => t.id === match.teamBId);

    // Estado para el modal de evento
    const [eventModalOpen, setEventModalOpen] = useState(false);
    const [eventTargetTeamId, setEventTargetTeamId] = useState(null);
    const [eventType, setEventType] = useState('goal'); // 'goal', 'yc', 'rc'

    const handleEvent = (teamId, type) => {
        if (!isLoggedIn) return; // Solo admin puede registrar eventos
        setEventTargetTeamId(teamId);
        setEventType(type);
        setEventModalOpen(true);
    };

    const handleUpdateStatus = async (newStatus) => {
        setLoading(true);
        try {
            const matchRef = doc(db, PUBLIC_COLLECTION_PATH, 'matches', match.id);
            await updateDoc(matchRef, { status: newStatus });
            setStatus(newStatus);
        } catch (e) {
            setError('Fallo al actualizar el estado del partido.');
        } finally {
            setLoading(false);
        }
        if (newStatus === 'Finalizado') {
            handleUpdateMatchScore(match.id, scoreA, scoreB, newStatus);
        }
    };

    const EventRegisterModal = ({ isOpen, onClose, team, type }) => {
        if (!isOpen || !team) return null;

        const [selectedPlayerId, setSelectedPlayerId] = useState('');
        const [isSaving, setIsSaving] = useState(false);

        const eventVerb = { goal: 'GOL', yc: 'Tarjeta Amarilla', rc: 'Tarjeta Roja' }[type];
        const teamScoreToUpdate = team.id === match.teamAId ? scoreA : scoreB;
        const setScoreFunction = team.id === match.teamAId ? setScoreA : setScoreB;

        const handleSave = async () => {
            if (!selectedPlayerId) return;
            setIsSaving(true);
            setError('');

            const playerIndex = team.players.findIndex(p => p.playerId === selectedPlayerId);
            if (playerIndex === -1) {
                setIsSaving(false);
                return;
            }

            const updatedPlayers = [...team.players];
            const playerToUpdate = updatedPlayers[playerIndex];

            // 1. Actualizar estadísticas del jugador y puntos de suspensión
            if (type === 'goal') {
                playerToUpdate.goals = (playerToUpdate.goals || 0) + 1;
            } else if (type === 'yc') {
                playerToUpdate.yc = (playerToUpdate.yc || 0) + 1;
                playerToUpdate.suspensionPoints = (playerToUpdate.suspensionPoints || 0) + 1;
            } else if (type === 'rc') {
                playerToUpdate.rc = (playerToUpdate.rc || 0) + 1;
                playerToUpdate.suspensionPoints = (playerToUpdate.suspensionPoints || 0) + 3;
            }

            // 2. Actualizar marcador del partido
            const newScore = type === 'goal' ? teamScoreToUpdate + 1 : teamScoreToUpdate;

            try {
                // Actualizar jugador en su equipo
                const teamRef = doc(db, PUBLIC_COLLECTION_PATH, 'teams', team.id);
                await updateDoc(teamRef, { players: updatedPlayers });

                // Actualizar marcador del partido
                const matchRef = doc(db, PUBLIC_COLLECTION_PATH, 'matches', match.id);
                const scoreField = team.id === match.teamAId ? 'scoreA' : 'scoreB';
                await updateDoc(matchRef, { [scoreField]: newScore });

                // Actualizar estado local del marcador
                setScoreFunction(newScore);

                onClose();
                alert(`¡${eventVerb} registrado con éxito para ${playerToUpdate.name}!`);

            } catch (e) {
                console.error("Error al registrar evento:", e);
                setError('Fallo al registrar el evento en Firestore.');
            } finally {
                setIsSaving(false);
            }
        };

        return (
            <Modal isOpen={isOpen} onClose={onClose} title={`Registrar ${eventVerb} - ${team.name}`}>
                <div className="space-y-4">
                    <p className="text-gray-300">Selecciona el jugador que realizó el evento:</p>
                    <select
                        value={selectedPlayerId}
                        onChange={(e) => setSelectedPlayerId(e.target.value)}
                        className="w-full p-3 bg-gray-700 text-white rounded-lg focus:ring-yellow-500 focus:outline-none"
                    >
                        <option value="">-- Seleccionar Jugador --</option>
                        {team.players && team.players.map(player => (
                            <option key={player.playerId} value={player.playerId}>{player.name} ({POSITION_MAP[player.position]})</option>
                        ))}
                    </select>

                    <button
                        onClick={handleSave}
                        className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition duration-200 disabled:opacity-50"
                        disabled={isSaving || !selectedPlayerId}
                    >
                        {isSaving ? 'Guardando...' : `Confirmar ${eventVerb}`}
                    </button>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                </div>
            </Modal>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Marcador EN VIVO" isLarge={true}>
            {/* Event Register Modal */}
            <EventRegisterModal
                isOpen={eventModalOpen}
                onClose={() => setEventModalOpen(false)}
                team={eventTargetTeamId === teamA?.id ? teamA : teamB}
                type={eventType}
            />

            {/* Marcador Principal */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-6 rounded-2xl shadow-xl mb-6 border border-yellow-500/50">
                {/* Equipo A */}
                <div className="flex flex-col items-center w-full md:w-5/12 p-2">
                    <h3 className="text-3xl font-extrabold text-white mb-2 text-center">{teamA?.name || 'Local'}</h3>
                    <p className="text-7xl font-black text-yellow-400 bg-gray-800 px-6 py-2 rounded-xl shadow-inner">{scoreA}</p>
                    {isLoggedIn && (
                        <div className="mt-4 flex flex-col space-y-2 w-full max-w-xs">
                            <button onClick={() => handleEvent(teamA.id, 'goal')} className="bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition duration-200">
                                + GOL
                            </button>
                            <div className="flex space-x-2">
                                <button onClick={() => handleEvent(teamA.id, 'yc')} className="bg-yellow-500 text-gray-900 font-semibold py-2 rounded-lg w-1/2 hover:bg-yellow-600 transition">
                                    + AMARILLA
                                </button>
                                <button onClick={() => handleEvent(teamA.id, 'rc')} className="bg-red-600 text-white font-semibold py-2 rounded-lg w-1/2 hover:bg-red-700 transition">
                                    + ROJA
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Separador */}
                <div className="flex flex-col items-center w-full md:w-1/12 my-4 md:my-0">
                    <span className="text-3xl font-extrabold text-white">VS</span>
                    <span className="text-sm text-gray-400 mt-1">{match.venueName}</span>
                </div>

                {/* Equipo B */}
                <div className="flex flex-col items-center w-full md:w-5/12 p-2">
                    <h3 className="text-3xl font-extrabold text-white mb-2 text-center">{teamB?.name || 'Visitante'}</h3>
                    <p className="text-7xl font-black text-yellow-400 bg-gray-800 px-6 py-2 rounded-xl shadow-inner">{scoreB}</p>
                    {isLoggedIn && (
                        <div className="mt-4 flex flex-col space-y-2 w-full max-w-xs">
                            <button onClick={() => handleEvent(teamB.id, 'goal')} className="bg-green-600 text-white font-semibold py-2 rounded-lg hover:bg-green-700 transition duration-200">
                                + GOL
                            </button>
                            <div className="flex space-x-2">
                                <button onClick={() => handleEvent(teamB.id, 'yc')} className="bg-yellow-500 text-gray-900 font-semibold py-2 rounded-lg w-1/2 hover:bg-yellow-600 transition">
                                    + AMARILLA
                                </button>
                                <button onClick={() => handleEvent(teamB.id, 'rc')} className="bg-red-600 text-white font-semibold py-2 rounded-lg w-1/2 hover:bg-red-700 transition">
                                    + ROJA
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Control de Estado */}
            {isLoggedIn && (
                <div className="mt-4 p-4 bg-gray-700 rounded-xl">
                    <p className="text-white font-semibold mb-2">Control de Estado del Partido:</p>
                    <div className="flex space-x-3 justify-center">
                        <button
                            onClick={() => handleUpdateStatus('Programado')}
                            className={`px-4 py-2 rounded-lg font-bold transition duration-200 ${status === 'Programado' ? 'bg-blue-800 text-white' : 'bg-gray-600 text-gray-300 hover:bg-blue-700'}`}
                            disabled={loading}
                        >
                            PROGRAMADO
                        </button>
                        <button
                            onClick={() => handleUpdateStatus('En Vivo')}
                            className={`px-4 py-2 rounded-lg font-bold transition duration-200 ${status === 'En Vivo' ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-green-700'}`}
                            disabled={loading}
                        >
                            EN VIVO
                        </button>
                        <button
                            onClick={() => handleUpdateStatus('Descanso')}
                            className={`px-4 py-2 rounded-lg font-bold transition duration-200 ${status === 'Descanso' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-blue-700'}`}
                            disabled={loading}
                        >
                            DESCANSO
                        </button>
                        <button
                            onClick={() => handleUpdateStatus('Finalizado')}
                            className={`px-4 py-2 rounded-lg font-bold transition duration-200 ${status === 'Finalizado' ? 'bg-red-500 text-white' : 'bg-gray-600 text-gray-300 hover:bg-red-700'}`}
                            disabled={loading}
                        >
                            FINALIZADO
                        </button>
                    </div>
                    {loading && <p className="text-center text-yellow-400 mt-2">Actualizando estado...</p>}
                </div>
            )}
        </Modal>
    );
};

// --- VISTAS DE PESTAÑAS PRINCIPALES ---

// 1. DASHBOARD INICIO
const HomeSection = ({ teams, matches, isLoggedIn, setAdminLoginOpen, setPlayerProfileOpen }) => {
    const totalTeams = teams.length;
    const totalMatchesPlayed = matches.filter(m => m.status === 'Finalizado').length;

    // Calcular Goleadores para el dashboard
    const allPlayers = useMemo(() => teams.flatMap(team => team.players || []), [teams]);

    const goalScorers = useMemo(() => {
        const scorerMap = new Map();
        allPlayers.forEach(player => {
            if (player.goals > 0) {
                scorerMap.set(player.playerId, {
                    name: player.name,
                    teamName: getTeamNameById(teams, player.teamId),
                    goals: player.goals,
                });
            }
        });
        return Array.from(scorerMap.values()).sort((a, b) => b.goals - a.goals);
    }, [allPlayers, teams]);

    const topScorer = goalScorers[0];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-white text-center">Dashboard Ejecutivo Montelíbano</h1>

            {/* Tarjetas de Métricas Clave */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-yellow-500 flex flex-col items-center">
                    <Users size={36} className="text-yellow-400 mb-3" />
                    <p className="text-5xl font-extrabold text-white">{totalTeams}</p>
                    <p className="text-lg text-gray-400 mt-1">Equipos Inscritos</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-green-500 flex flex-col items-center">
                    <Swords size={36} className="text-green-400 mb-3" />
                    <p className="text-5xl font-extrabold text-white">{totalMatchesPlayed}</p>
                    <p className="text-lg text-gray-400 mt-1">Partidos Jugados</p>
                </div>

                <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-red-500 flex flex-col items-center">
                    <Award size={36} className="text-red-400 mb-3" />
                    <p className="text-xl font-extrabold text-white h-full max-w-full truncate overflow-hidden">
                        {topScorer ? topScorer.name : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-400">Máximo Goleador ({topScorer?.goals || 0})</p>
                </div>
            </div>

            {/* Partidos en Vivo */}
            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border border-gray-700">
                <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center">
                    <Zap size={24} className="mr-2" /> Partidos Recientes / EN VIVO
                </h2>
                <div className="space-y-4">
                    {matches.filter(m => m.status !== 'Programado').sort((a, b) => b.date.seconds - a.date.seconds).slice(0, 3).map(match => (
                        <div key={match.id} className="bg-gray-700 p-3 rounded-lg flex justify-between items-center text-white">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(match.status)}`}>{match.status}</span>
                            <span className="font-semibold text-center flex-grow mx-2">
                                {getTeamNameById(teams, match.teamAId)} {match.scoreA} - {match.scoreB} {getTeamNameById(teams, match.teamBId)}
                            </span>
                            <span className="text-sm text-gray-400">{formatFirestoreTimestamp(match.date)}</span>
                        </div>
                    ))}
                    {matches.length === 0 && (
                        <p className="text-gray-400 text-center">No hay partidos registrados aún.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// 2. EQUIPOS Y PLANTILLAS
const TeamsSection = ({ teams, isLoggedIn, setTeams, setPlayerProfileOpen, matches }) => {
    const [teamName, setTeamName] = useState('');
    const [coachName, setCoachName] = useState('');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [rosterModalOpen, setRosterModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [campoModalOpen, setCampoModalOpen] = useState(false);

    const handleAddTeam = async (e) => {
        e.preventDefault();
        if (!teamName || !coachName) return;

        try {
            const teamRef = collection(db, PUBLIC_COLLECTION_PATH, 'teams');
            await addDoc(teamRef, {
                name: teamName,
                coach: coachName,
                createdAt: new Date(),
                players: [] // Inicializar plantilla
            });
            setTeamName('');
            setCoachName('');
        } catch (e) {
            console.error("Error al añadir equipo:", e);
        }
    };

    const handleDeleteTeam = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este equipo? Esto es irreversible.')) {
            try {
                const teamRef = doc(db, PUBLIC_COLLECTION_PATH, 'teams', id);
                await deleteDoc(teamRef);
            } catch (e) {
                console.error("Error al eliminar equipo:", e);
            }
        }
    };

    // --- Sub-Componentes Modales ---

    // 2.1 Modal de Plantilla (Roster)
    const RosterModal = ({ isOpen, onClose, team, setTeams }) => {
        const [newPlayerName, setNewPlayerName] = useState('');
        const [newPlayerPosition, setNewPlayerPosition] = useState('FW');
        const [error, setError] = useState('');
        const [isEditingPlayerId, setIsEditingPlayerId] = useState(null);
        const [editNumber, setEditNumber] = useState('');
        const [editBio, setEditBio] = useState('');
        const [editPicUrl, setEditPicUrl] = useState('');
        const [editPoints, setEditPoints] = useState('');

        const handleAddPlayer = async (e) => {
            e.preventDefault();
            if (!newPlayerName) return;

            const newPlayer = {
                playerId: Math.random().toString(36).substring(2, 10), // ID simple simulado
                name: newPlayerName,
                position: newPlayerPosition,
                number: null,
                goals: 0,
                yc: 0,
                rc: 0,
                suspensionPoints: 0,
                profilePicUrl: null,
                bio: null,
            };

            const updatedPlayers = [...(team.players || []), newPlayer];
            try {
                const teamRef = doc(db, PUBLIC_COLLECTION_PATH, 'teams', team.id);
                await updateDoc(teamRef, { players: updatedPlayers });

                // Actualizar estado local
                setTeams(teams.map(t => t.id === team.id ? { ...team, players: updatedPlayers } : t));

                setNewPlayerName('');
                setNewPlayerPosition('FW');
            } catch (e) {
                console.error("Error al añadir jugador:", e);
            }
        };

        const handleDeletePlayer = async (playerId) => {
            const updatedPlayers = team.players.filter(p => p.playerId !== playerId);
            if (window.confirm(`¿Seguro que quieres eliminar al jugador ${team.players.find(p => p.playerId === playerId)?.name}?`)) {
                try {
                    const teamRef = doc(db, PUBLIC_COLLECTION_PATH, 'teams', team.id);
                    await updateDoc(teamRef, { players: updatedPlayers });
                    setTeams(teams.map(t => t.id === team.id ? { ...team, players: updatedPlayers } : t));
                } catch (e) {
                    console.error("Error al eliminar jugador:", e);
                }
            }
        };

        const startEdit = (player) => {
            setIsEditingPlayerId(player.playerId);
            setEditNumber(player.number || '');
            setEditBio(player.bio || '');
            setEditPicUrl(player.profilePicUrl || '');
            setEditPoints(player.suspensionPoints || 0);
        };

        const handleSaveEdit = async (playerToUpdate) => {
            const playerIndex = team.players.findIndex(p => p.playerId === playerToUpdate.playerId);
            if (playerIndex === -1) return;

            const updatedPlayers = [...team.players];
            updatedPlayers[playerIndex] = {
                ...playerToUpdate,
                number: parseInt(editNumber) || playerToUpdate.number,
                bio: editBio,
                profilePicUrl: editPicUrl,
                suspensionPoints: parseInt(editPoints) >= 0 ? parseInt(editPoints) : 0,
            };

            try {
                const teamRef = doc(db, PUBLIC_COLLECTION_PATH, 'teams', team.id);
                await updateDoc(teamRef, { players: updatedPlayers });

                // Actualizar estado local
                setTeams(teams.map(t => t.id === team.id ? { ...team, players: updatedPlayers } : t));
                setIsEditingPlayerId(null);
            } catch (e) {
                console.error("Error al guardar edición:", e);
            }
        };

        const handleResetPoints = (player) => {
            if (window.confirm(`¿Deseas resetear los Puntos de Suspensión de ${player.name} a 0?`)) {
                const playerIndex = team.players.findIndex(p => p.playerId === player.playerId);
                if (playerIndex === -1) return;

                const updatedPlayers = [...team.players];
                updatedPlayers[playerIndex] = { ...player, suspensionPoints: 0 };

                try {
                    const teamRef = doc(db, PUBLIC_COLLECTION_PATH, 'teams', team.id);
                    updateDoc(teamRef, { players: updatedPlayers });
                    setTeams(teams.map(t => t.id === team.id ? { ...team, players: updatedPlayers } : t));
                } catch (e) {
                    console.error("Error al resetear puntos:", e);
                }
            }
        };


        if (!isOpen) return null;

        const playersSorted = team.players.sort((a, b) => POSITIONS_ORDER.indexOf(a.position) - POSITIONS_ORDER.indexOf(b.position));

        return (
            <Modal isOpen={isOpen} onClose={onClose} title={`Plantilla: ${team.name}`} isLarge={true}>
                {isLoggedIn && (
                    <form onSubmit={handleAddPlayer} className="bg-gray-700 p-4 rounded-xl mb-6 flex flex-wrap gap-2 items-center">
                        <h3 className="text-white font-bold w-full mb-2">Añadir Nuevo Jugador</h3>
                        <input
                            type="text"
                            placeholder="Nombre Completo del Jugador"
                            value={newPlayerName}
                            onChange={(e) => setNewPlayerName(e.target.value)}
                            className="p-2 bg-gray-600 text-white rounded-lg flex-grow min-w-[150px]"
                        />
                        <select
                            value={newPlayerPosition}
                            onChange={(e) => setNewPlayerPosition(e.target.value)}
                            className="p-2 bg-gray-600 text-white rounded-lg min-w-[150px]"
                        >
                            {Object.entries(POSITION_MAP).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>
                        <button type="submit" className="bg-green-600 text-white p-2 rounded-lg flex items-center justify-center hover:bg-green-700 transition">
                            <Plus size={20} className="mr-1" /> Registrar
                        </button>
                    </form>
                )}

                <div className="space-y-4">
                    {playersSorted.length === 0 && <p className="text-gray-400 text-center">No hay jugadores en esta plantilla.</p>}
                    {playersSorted.map(player => (
                        <div key={player.playerId} className="bg-gray-900 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center shadow-md border-b-2 border-green-700">
                            <div className="flex items-center space-x-4 flex-grow">
                                <img
                                    src={player.profilePicUrl || 'https://placehold.co/50x50/34D399/ffffff?text=J'}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50/34D399/ffffff?text=J'; }}
                                />
                                <div>
                                    <p className="text-lg font-bold text-white flex items-center">{player.name}
                                        {((player.suspensionPoints || 0) >= SUSPENSION_POINTS_THRESHOLD) && (
                                            <span className="ml-2 text-red-500 font-extrabold text-sm flex items-center bg-red-900 px-2 py-0.5 rounded-full"><Zap size={14} className="mr-1" /> SUSPENDIDO</span>
                                        )}
                                    </p>
                                    <p className="text-sm text-yellow-400">{POSITION_MAP[player.position]} #{player.number || '00'}</p>
                                    <p className="text-xs text-gray-500">ID: {player.playerId}</p>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-3 md:mt-0">
                                <span className="text-sm bg-green-700 px-2 py-1 rounded-full">{player.goals || 0} Goles</span>
                                <span className="text-sm bg-yellow-700 px-2 py-1 rounded-full">{player.yc || 0} A / {player.rc || 0} R</span>
                                <span className="text-sm bg-gray-700 px-2 py-1 rounded-full flex items-center">{player.suspensionPoints || 0} PS</span>
                            </div>
                            {isLoggedIn && (
                                <div className="flex space-x-2 mt-3 md:mt-0">
                                    {isEditingPlayerId === player.playerId ? (
                                        <>
                                            <button onClick={() => handleSaveEdit(player)} className="text-green-500 hover:text-green-400 transition" title="Guardar">
                                                <Edit3 size={20} />
                                            </button>
                                            <button onClick={() => setIsEditingPlayerId(null)} className="text-gray-500 hover:text-white transition" title="Cancelar">
                                                <X size={20} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(player)} className="text-blue-500 hover:text-blue-400 transition" title="Editar">
                                                <Edit3 size={20} />
                                            </button>
                                            <button onClick={() => handleResetPoints(player)} className="text-orange-500 hover:text-orange-400 transition" title="Resetear Puntos de Suspensión">
                                                <RotateCcw size={20} />
                                            </button>
                                            <button onClick={() => handleDeletePlayer(player.playerId)} className="text-red-500 hover:text-red-400 transition" title="Eliminar">
                                                <Trash2 size={20} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {isEditingPlayerId === player.playerId && (
                                <div className="mt-3 p-3 bg-gray-800 rounded-lg w-full md:w-auto">
                                    <p className="text-sm text-yellow-400 font-bold mb-2">Edición Rápida (Admin)</p>
                                    <input
                                        type="number"
                                        placeholder="# Camiseta"
                                        value={editNumber}
                                        onChange={(e) => setEditNumber(e.target.value)}
                                        className="w-full p-2 bg-gray-700 text-white rounded-lg mb-2 text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Puntos Suspensión (PS)"
                                        value={editPoints}
                                        onChange={(e) => setEditPoints(e.target.value)}
                                        className="w-full p-2 bg-gray-700 text-white rounded-lg text-sm"
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Modal>
        );
    };

    // 2.2 Modal de Detalles de Equipo
    const TeamDetailModal = ({ isOpen, onClose, team, matches }) => {
        if (!isOpen || !team) return null;
        const teamStats = useMemo(() => {
            const stats = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
            teamMatches.forEach(match => {
        const teamMatches = matches.filter(m => m.status === 'Finalizado' && (m.teamAId === team.id || m.teamBId === team.id));

        
                const isHome = match.teamAId === team.id;
                const scoreF = isHome ? match.scoreA : match.scoreB;
                const scoreC = isHome ? match.scoreB : match.scoreA;

                stats.pj++;
                stats.gf += scoreF;
                stats.gc += scoreC;

                if (scoreF > scoreC) {
                    stats.pg++;
                    stats.pts += 3;
                } else if (scoreF === scoreC) {
                    stats.pe++;
                    stats.pts += 1;
                } else {
                    stats.pp++;
                }
            });
            return stats;
        }, [teamMatches, team.id]);

        

        return (
            <Modal isOpen={isOpen} onClose={onClose} title={`Detalles: ${team.name}`} isLarge={true}>
                <div className="space-y-6">
                    {/* Resumen de Récord */}
                    <div className="bg-gray-900 p-5 rounded-xl shadow-inner border border-yellow-500/50">
                        <h3 className="text-xl font-bold text-yellow-400 mb-3">Récord de la Temporada</h3>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-center text-white font-semibold">
                            <span className="text-sm text-gray-400">PTS</span>
                            <span className="text-sm text-gray-400">PJ</span>
                            <span className="text-sm text-gray-400">PG</span>
                            <span className="text-sm text-gray-400">PE</span>
                            <span className="text-sm text-gray-400">PP</span>
                            <span className="text-sm text-gray-400">GF</span>
                            <span className="text-sm text-gray-400">GC</span>
                        </div>
                        <div className="grid grid-cols-4 md:grid-cols-7 gap-2 text-center text-white text-2xl font-extrabold mt-1">
                            <span className="text-yellow-400">{teamStats.pts}</span>
                            <span>{teamStats.pj}</span>
                            <span className="text-green-400">{teamStats.pg}</span>
                            <span className="text-blue-400">{teamStats.pe}</span>
                            <span className="text-red-400">{teamStats.pp}</span>
                            <span>{teamStats.gf}</span>
                            <span>{teamStats.gc}</span>
                        </div>
                    </div>

                    {/* Líderes del Equipo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900 p-5 rounded-xl shadow-inner border border-green-700/50">
                            <h3 className="text-xl font-bold text-green-400 mb-3 flex items-center"><Target size={20} className="mr-2" /> Máximos Goleadores</h3>
                            <ul className="space-y-2">
                                {leaders.goals.length === 0 && <p className="text-gray-400 text-sm">Sin goles aún.</p>}
                                {leaders.goals.map(player => (
                                    <li key={player.playerId} className="flex justify-between items-center text-white border-b border-gray-700/50 pb-1">
                                        <span className="text-base">{player.name}</span>
                                        <span className="bg-green-600 px-2 rounded-full font-bold text-sm">{player.goals}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-gray-900 p-5 rounded-xl shadow-inner border border-red-700/50">
                            <h3 className="text-xl font-bold text-red-400 mb-3 flex items-center"><Zap size={20} className="mr-2" /> Más Sancionados</h3>
                            <ul className="space-y-2">
                                {leaders.cards.length === 0 && <p className="text-gray-400 text-sm">Sin tarjetas aún.</p>}
                                {leaders.cards.map(player => (
                                    <li key={player.playerId} className="flex justify-between items-center text-white border-b border-gray-700/50 pb-1">
                                        <span className="text-base">{player.name}</span>
                                        <span className="text-sm font-bold">
                                            <span className="text-yellow-400">{player.yc} A</span> / <span className="text-red-500">{player.rc} R</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Historial de Partidos */}
                    <div className="bg-gray-800 p-5 rounded-xl shadow-md border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-3">Historial de Partidos</h3>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {teamMatches.length === 0 && <p className="text-gray-400 text-center">No hay partidos finalizados para este equipo.</p>}
                            {teamMatches.sort((a, b) => b.date.seconds - a.date.seconds).map(match => {
                                const isHome = match.teamAId === team.id;
                                const opponentId = isHome ? match.teamBId : match.teamAId;
                                const scoreF = isHome ? match.scoreA : match.scoreB;
                                const scoreC = isHome ? match.scoreB : match.scoreA;
                                const resultColor = scoreF > scoreC ? 'text-green-400 font-bold' : scoreF < scoreC ? 'text-red-400 font-bold' : 'text-blue-400';

                                return (
                                    <div key={match.id} className="bg-gray-700 p-3 rounded-lg text-white flex justify-between items-center">
                                        <span className="text-sm text-gray-400">{formatFirestoreTimestamp(match.date)}</span>
                                        <span className={`text-center ${resultColor}`}>
                                            vs {getTeamNameById(teams, opponentId)}: {scoreF} - {scoreC}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Modal>
        );
    };

    // 2.3 Modal de Vista de Campo
    const CampoModal = ({ isOpen, onClose, team }) => {
        if (!isOpen || !team) return null;

        const playersByPosition = useMemo(() => {
            const organized = {
                GK: [], DF: [], MF: [], FW: [], SU: [],
            };
            team.players?.forEach(player => {
                if (organized[player.position]) {
                    organized[player.position].push(player);
                }
            });
            return organized;
        }, [team.players]);

        const PlayerMarker = ({ player }) => {
            const isSuspended = (player.suspensionPoints || 0) >= SUSPENSION_POINTS_THRESHOLD;
            return (
                <div className="flex flex-col items-center p-1 bg-gray-900 rounded-lg shadow-md border border-green-700/50 hover:scale-105 transition duration-150">
                    <img
                        src={player.profilePicUrl || 'https://placehold.co/40x40/34D399/ffffff?text=J'}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400"
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/40x40/34D399/ffffff?text=J'; }}
                    />
                    <span className="text-xs font-semibold text-white mt-1 truncate max-w-[80px]">{player.name}</span>
                    <div className="flex space-x-1 mt-0.5">
                        {isSuspended && <Zap size={10} className="text-red-500" title="Suspendido" />}
                        {player.yc > 0 && <span className="text-yellow-400 text-xs">{player.yc}</span>}
                        {player.rc > 0 && <span className="text-red-500 text-xs">{player.rc}</span>}
                    </div>
                </div>
            );
        };

        return (
            <Modal isOpen={isOpen} onClose={onClose} title={`Campo de Juego: ${team.name}`} isLarge={true}>
                <div className="bg-green-800 w-full h-[600px] border-8 border-white rounded-xl shadow-2xl relative overflow-hidden">
                    {/* Campo de Juego (Líneas) */}
                    <div className="absolute inset-0 border border-white opacity-20"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-0 border-t border-white opacity-30"></div> {/* Línea Central */}
                    <div className="absolute top-1/2 left-1/2 w-20 h-20 border border-white rounded-full -translate-x-1/2 -translate-y-1/2 opacity-30"></div> {/* Círculo central */}

                    {/* Área de Gol Izquierda */}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-[400px] w-[120px] border border-white opacity-30"></div>
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-[200px] w-[50px] border border-white opacity-30"></div>
                    {/* Área de Gol Derecha */}
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 h-[400px] w-[120px] border border-white opacity-30"></div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 h-[200px] w-[50px] border border-white opacity-30"></div>

                    {/* Jugadores - Posiciones absolutas para un look de pizarra */}
                    <div className="absolute w-full h-full p-4">
                        {/* 1. Portero (GK) - Cerca de la portería */}
                        <div className="absolute left-[5%] top-1/2 transform -translate-y-1/2 space-y-2">
                            {playersByPosition.GK.map(p => <PlayerMarker key={p.playerId} player={p} />)}
                        </div>

                        {/* 2. Defensas (DF) - Detrás de la línea central */}
                        <div className="absolute left-[20%] top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
                            {playersByPosition.DF.slice(0, 4).map(p => <PlayerMarker key={p.playerId} player={p} />)}
                        </div>
                        {playersByPosition.DF.slice(4).length > 0 && (
                             <div className="absolute left-[30%] top-1/2 transform -translate-y-1/2">
                                 {playersByPosition.DF.slice(4).map(p => <PlayerMarker key={p.playerId} player={p} />)}
                             </div>
                         )}

                        {/* 3. Mediocampistas (MF) - Alrededor del centro */}
                        <div className="absolute left-[50%] top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex space-x-4">
                            {playersByPosition.MF.slice(0, 3).map(p => <PlayerMarker key={p.playerId} player={p} />)}
                        </div>
                         {playersByPosition.MF.slice(3).length > 0 && (
                            <div className="absolute left-[50%] top-[70%] transform -translate-x-1/2 space-x-2 flex">
                                {playersByPosition.MF.slice(3).map(p => <PlayerMarker key={p.playerId} player={p} />)}
                            </div>
                        )}

                        {/* 4. Delanteros (FW) - Cerca del área rival */}
                        <div className="absolute left-[75%] top-1/2 transform -translate-y-1/2 flex flex-col space-y-4">
                            {playersByPosition.FW.slice(0, 2).map(p => <PlayerMarker key={p.playerId} player={p} />)}
                        </div>
                        {playersByPosition.FW.slice(2).length > 0 && (
                             <div className="absolute left-[85%] top-1/2 transform -translate-y-1/2">
                                 {playersByPosition.FW.slice(2).map(p => <PlayerMarker key={p.playerId} player={p} />)}
                             </div>
                         )}

                        {/* 5. Suplentes (SU) - Fuera del campo */}
                        {playersByPosition.SU.length > 0 && (
                            <div className="absolute -bottom-8 left-4 p-2 bg-gray-900/80 rounded-t-lg">
                                <span className="text-xs text-yellow-400 font-bold">SUPLENTES:</span>
                                <div className="flex space-x-2 mt-1">
                                    {playersByPosition.SU.map(p => <PlayerMarker key={p.playerId} player={p} />)}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="absolute bottom-4 right-4 bg-gray-900/80 p-3 rounded-lg text-white text-xs">
                        {team.coach ? `DT: ${team.coach}` : 'DT: No Asignado'}
                    </div>
                </div>
            </Modal>
        );
    };

    if (!selectedTeam && rosterModalOpen) setRosterModalOpen(false);
    if (!selectedTeam && detailModalOpen) setDetailModalOpen(false);
    if (!selectedTeam && campoModalOpen) setCampoModalOpen(false);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-white text-center">Gestión de Equipos</h1>

            {/* Modal de Plantilla */}
            {selectedTeam && (
                <RosterModal
                    isOpen={rosterModalOpen}
                    onClose={() => { setRosterModalOpen(false); setSelectedTeam(null); }}
                    team={selectedTeam}
                    setTeams={setTeams}
                />
            )}
            {/* Modal de Detalles */}
            {selectedTeam && (
                <TeamDetailModal
                    isOpen={detailModalOpen}
                    onClose={() => { setDetailModalOpen(false); setSelectedTeam(null); }}
                    team={selectedTeam}
                    matches={matches}
                />
            )}
            {/* Modal de Campo de Juego */}
            {selectedTeam && (
                <CampoModal
                    isOpen={campoModalOpen}
                    onClose={() => { setCampoModalOpen(false); setSelectedTeam(null); }}
                    team={selectedTeam}
                />
            )}

            {/* Formulario de Registro (Admin Only) */}
            {isLoggedIn && (
                <form onSubmit={handleAddTeam} className="bg-gray-700 p-5 rounded-2xl shadow-xl space-y-3 max-w-lg mx-auto">
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">Registrar Nuevo Equipo</h2>
                    <input
                        type="text"
                        placeholder="Nombre del Equipo (Ej: Real Montelíbano)"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="w-full p-3 bg-gray-600 text-white rounded-lg focus:ring-green-500 focus:outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Nombre del Entrenador (DT)"
                        value={coachName}
                        onChange={(e) => setCoachName(e.target.value)}
                        className="w-full p-3 bg-gray-600 text-white rounded-lg focus:ring-green-500 focus:outline-none"
                    />
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center">
                        <Plus size={20} className="mr-2" /> Crear Equipo
                    </button>
                </form>
            )}

            {/* Listado de Equipos */}
            <div className="space-y-4 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-white mb-3 text-center border-b border-gray-700 pb-2">Equipos Registrados ({teams.length})</h2>
                {teams.length === 0 && <p className="text-gray-400 text-center">No hay equipos inscritos.</p>}
                {teams.map(team => (
                    <div key={team.id} className="bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-yellow-400">{team.name}</h3>
                            {isLoggedIn && (
                                <button onClick={() => handleDeleteTeam(team.id)} className="text-red-500 hover:text-red-400 transition" title="Eliminar Equipo">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-400">DT: {team.coach}</p>
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-700">
                            <button
                                onClick={() => { setSelectedTeam(team); setRosterModalOpen(true); }}
                                className="bg-blue-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                            >
                                Plantilla ({team.players?.length || 0})
                            </button>
                            <button
                                onClick={() => { setSelectedTeam(team); setDetailModalOpen(true); }}
                                className="bg-indigo-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-indigo-700 transition flex items-center"
                            >
                                <Award size={16} className="mr-1" /> Detalle
                            </button>
                            <button
                                onClick={() => { setSelectedTeam(team); setCampoModalOpen(true); }}
                                className="bg-green-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-green-700 transition flex items-center"
                            >
                                <MapPin size={16} className="mr-1" /> Campo
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 border-t border-gray-700 pt-6 max-w-lg mx-auto">
                <button
                    onClick={() => setPlayerProfileOpen(true)}
                    className="w-full bg-yellow-500 text-gray-900 font-bold py-3 px-4 rounded-xl shadow-md hover:bg-yellow-600 transition flex items-center justify-center"
                >
                    <User size={20} className="mr-2" /> Acceder a mi Perfil de Jugador
                </button>
            </div>
        </div>
    );
};


// 3. NOTICIAS
const NewsSection = ({ news, isLoggedIn, currentUserId }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handlePostNews = async (e) => {
        e.preventDefault();
        if (!title || !content) return;

        try {
            const newsRef = collection(db, PUBLIC_COLLECTION_PATH, 'news');
            await addDoc(newsRef, {
                title: title,
                content: content,
                timestamp: new Date(),
                authorId: currentUserId
            });
            setTitle('');
            setContent('');
        } catch (e) {
            console.error("Error al publicar noticia:", e);
        }
    };

    const handleDeleteNews = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
            try {
                const newsRef = doc(db, PUBLIC_COLLECTION_PATH, 'news', id);
                await deleteDoc(newsRef);
            } catch (e) {
                console.error("Error al eliminar noticia:", e);
            }
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-white text-center">Noticias de la Liga</h1>

            {/* Formulario de Publicación (Admin Only) */}
            {isLoggedIn && (
                <form onSubmit={handlePostNews} className="bg-gray-700 p-5 rounded-2xl shadow-xl space-y-3 max-w-lg mx-auto">
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">Publicar Anuncio</h2>
                    <input
                        type="text"
                        placeholder="Título de la Noticia"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-3 bg-gray-600 text-white rounded-lg focus:ring-green-500 focus:outline-none"
                    />
                    <textarea
                        placeholder="Contenido de la Noticia"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="4"
                        className="w-full p-3 bg-gray-600 text-white rounded-lg focus:ring-green-500 focus:outline-none resize-none"
                    />
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center">
                        <Newspaper size={20} className="mr-2" /> Publicar
                    </button>
                </form>
            )}

            {/* Feed de Noticias */}
            <div className="space-y-4 max-w-lg mx-auto">
                {news.length === 0 && <p className="text-gray-400 text-center">No hay noticias publicadas.</p>}
                {news.map(item => (
                    <div key={item.id} className="bg-gray-800 p-5 rounded-xl shadow-xl border-l-4 border-yellow-500">
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                            {isLoggedIn && (
                                <button onClick={() => handleDeleteNews(item.id)} className="text-red-500 hover:text-red-400 transition ml-4" title="Eliminar Noticia">
                                    <Trash2 size={20} />
                                </button>
                            )}
                        </div>
                        <p className="text-gray-300 mb-3">{item.content}</p>
                        <p className="text-xs text-gray-500 border-t border-gray-700 pt-2 mt-2">Publicado: {formatFirestoreTimestamp(item.timestamp)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 4. PARTIDOS Y MARCADOR
const MatchesSection = ({ matches, teams, venues, isLoggedIn, setTeams }) => {
    const [date, setDate] = useState('');
    const [teamAId, setTeamAId] = useState('');
    const [teamBId, setTeamBId] = useState('');
    const [venueId, setVenueId] = useState('');
    const [liveModalOpen, setLiveModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);

    const handleScheduleMatch = async (e) => {
        e.preventDefault();
        if (!date || !teamAId || !teamBId || !venueId || teamAId === teamBId) return;

        const venueName = venues.find(v => v.id === venueId)?.name || 'Cancha Desconocida';

        try {
            const matchRef = collection(db, PUBLIC_COLLECTION_PATH, 'matches');
            await addDoc(matchRef, {
                date: new Date(date),
                teamAId: teamAId,
                teamBId: teamBId,
                venueId: venueId,
                venueName: venueName,
                scoreA: 0,
                scoreB: 0,
                status: 'Programado' // Programado, En Vivo, Descanso, Finalizado
            });
            setDate('');
            setTeamAId('');
            setTeamBId('');
            setVenueId('');
        } catch (e) {
            console.error("Error al programar partido:", e);
        }
    };

    const handleDeleteMatch = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este partido?')) {
            try {
                const matchRef = doc(db, PUBLIC_COLLECTION_PATH, 'matches', id);
                await deleteDoc(matchRef);
            } catch (e) {
                console.error("Error al eliminar partido:", e);
            }
        }
    };

    const handleOpenLiveModal = (match) => {
        setSelectedMatch(match);
        setLiveModalOpen(true);
    };

    const handleUpdateMatchScore = async (matchId, scoreA, scoreB, status) => {
        try {
            const matchRef = doc(db, PUBLIC_COLLECTION_PATH, 'matches', matchId);
            await updateDoc(matchRef, {
                scoreA: scoreA,
                scoreB: scoreB,
                status: status
            });
        } catch (e) {
            console.error("Error al actualizar marcador:", e);
        }
    };

    const matchesSorted = matches.sort((a, b) => {
        // Ordenar: En Vivo primero, luego por fecha más reciente
        if (a.status === 'En Vivo' && b.status !== 'En Vivo') return -1;
        if (a.status !== 'En Vivo' && b.status === 'En Vivo') return 1;
        return b.date.seconds - a.date.seconds;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-white text-center">Calendario y Marcadores</h1>

            {/* Modal de Marcador en Vivo */}
            <LiveScoreModal
                isOpen={liveModalOpen}
                onClose={() => setLiveModalOpen(false)}
                match={selectedMatch}
                teams={teams}
                handleUpdateMatchScore={handleUpdateMatchScore}
                isLoggedIn={isLoggedIn}
            />

            {/* Formulario de Programación (Admin Only) */}
            {isLoggedIn && (
                <form onSubmit={handleScheduleMatch} className="bg-gray-700 p-5 rounded-2xl shadow-xl space-y-3 max-w-lg mx-auto">
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">Programar Partido</h2>
                    <div className="flex flex-col space-y-3">
                        <select value={teamAId} onChange={(e) => setTeamAId(e.target.value)} className="w-full p-3 bg-gray-600 text-white rounded-lg">
                            <option value="">-- Equipo Local --</option>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                        <select value={teamBId} onChange={(e) => setTeamBId(e.target.value)} className="w-full p-3 bg-gray-600 text-white rounded-lg">
                            <option value="">-- Equipo Visitante --</option>
                            {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                        </select>
                        <select value={venueId} onChange={(e) => setVenueId(e.target.value)} className="w-full p-3 bg-gray-600 text-white rounded-lg">
                            <option value="">-- Cancha / Sede --</option>
                            {venues.map(venue => <option key={venue.id} value={venue.id}>{venue.name}</option>)}
                        </select>
                        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 bg-gray-600 text-white rounded-lg" />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition">
                        <Plus size={20} className="mr-2" /> Programar
                    </button>
                    {teamAId && teamAId === teamBId && <p className="text-red-400 text-sm">Los equipos no pueden ser iguales.</p>}
                </form>
            )}

            {/* Lista de Partidos */}
            <div className="space-y-4 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-white mb-3 text-center border-b border-gray-700 pb-2">Partidos</h2>
                {matches.length === 0 && <p className="text-gray-400 text-center">No hay partidos programados.</p>}
                {matchesSorted.map(match => (
                    <div key={match.id} className={`bg-gray-800 p-4 rounded-xl shadow-lg border-l-4 ${match.status === 'En Vivo' ? 'border-red-500 animate-pulse' : 'border-blue-500'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-sm text-gray-400">{match.venueName}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getStatusColor(match.status)}`}>
                                {match.status.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-xl font-extrabold text-white text-center flex-grow">
                                {getTeamNameById(teams, match.teamAId)} <span className="text-yellow-400">{match.scoreA}</span> - <span className="text-yellow-400">{match.scoreB}</span> {getTeamNameById(teams, match.teamBId)}
                            </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">{formatFirestoreTimestamp(match.date)}</p>

                        <div className="flex justify-center space-x-2 mt-3 pt-3 border-t border-gray-700">
                            <button
                                onClick={() => handleOpenLiveModal(match)}
                                className="bg-yellow-500 text-gray-900 text-sm px-3 py-1 rounded-lg hover:bg-yellow-600 transition"
                            >
                                Ver Marcador
                            </button>
                            {isLoggedIn && (
                                <button
                                    onClick={() => handleDeleteMatch(match.id)}
                                    className="bg-red-600 text-white text-sm px-3 py-1 rounded-lg hover:bg-red-700 transition"
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 5. CLASIFICACIÓN
const StandingsSection = ({ teams, matches }) => {

    const calculateStandings = useCallback(() => {
        const standingsMap = new Map();

        teams.forEach(team => {
            standingsMap.set(team.id, {
                id: team.id,
                name: team.name,
                pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0,
            });
        });

        matches.filter(m => m.status === 'Finalizado').forEach(match => {
            const teamAStats = standingsMap.get(match.teamAId);
            const teamBStats = standingsMap.get(match.teamBId);

            if (teamAStats && teamBStats) {
                teamAStats.pj++;
                teamBStats.pj++;
                teamAStats.gf += match.scoreA;
                teamBStats.gf += match.scoreB;
                teamAStats.gc += match.scoreB;
                teamBStats.gc += match.scoreA;

                if (match.scoreA > match.scoreB) {
                    teamAStats.pg++;
                    teamAStats.pts += 3;
                    teamBStats.pp++;
                } else if (match.scoreA < match.scoreB) {
                    teamBStats.pg++;
                    teamBStats.pts += 3;
                    teamAStats.pp++;
                } else {
                    teamAStats.pe++;
                    teamBStats.pe++;
                    teamAStats.pts += 1;
                    teamBStats.pts += 1;
                }
            }
        });

        // Convertir a array y ordenar
        return Array.from(standingsMap.values())
            .sort((a, b) => {
                if (b.pts !== a.pts) return b.pts - a.pts; // 1. Puntos
                if ((b.gf - b.gc) !== (a.gf - a.gc)) return (b.gf - b.gc) - (a.gf - a.gc); // 2. Diferencia de Gol
                return b.gf - a.gf; // 3. Goles a Favor
            });
    }, [teams, matches]);

    const leagueStandings = useMemo(calculateStandings, [calculateStandings]);

    const calculateGoalScorers = useCallback(() => {
        const allPlayers = teams.flatMap(team => team.players || []);
        const scorers = allPlayers.filter(p => p.goals > 0);

        return scorers.map(player => ({
            name: player.name,
            goals: player.goals,
            teamName: getTeamNameById(teams, getTeamById(teams, player.teamId)?.id),
            teamId: getTeamById(teams, player.teamId)?.id
        }))
        .sort((a, b) => b.goals - a.goals)
        .slice(0, 10); // Top 10
    }, [teams]);

    const goalScorers = useMemo(calculateGoalScorers, [calculateGoalScorers]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-white text-center">Clasificación de la Liga</h1>

            {/* Tabla de Posiciones */}
            <div className="bg-gray-800 p-5 rounded-2xl shadow-xl border border-gray-700 overflow-x-auto">
                <h2 className="text-xl font-bold text-yellow-400 mb-4 text-center">Tabla General</h2>
                <table className="min-w-full text-white text-sm">
                    <thead>
                        <tr className="bg-gray-900 uppercase text-xs tracking-wider">
                            <th className="py-2 px-1 text-center">#</th>
                            <th className="py-2 px-3 text-left">Equipo</th>
                            <th className="py-2 px-1 text-center">PTS</th>
                            <th className="py-2 px-1 text-center">PJ</th>
                            <th className="py-2 px-1 text-center hidden sm:table-cell">PG</th>
                            <th className="py-2 px-1 text-center hidden sm:table-cell">PE</th>
                            <th className="py-2 px-1 text-center hidden sm:table-cell">PP</th>
                            <th className="py-2 px-1 text-center">GF</th>
                            <th className="py-2 px-1 text-center">GC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leagueStandings.length === 0 && (
                             <tr><td colSpan="9" className="text-center py-4 text-gray-400">No hay partidos finalizados para clasificar.</td></tr>
                        )}
                        {leagueStandings.map((team, index) => (
                            <tr key={team.id} className={`border-b border-gray-700 ${index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-800'}`}>
                                <td className="py-2 px-1 text-center font-bold text-yellow-400">{index + 1}</td>
                                <td className="py-2 px-3 text-left font-semibold truncate max-w-xs">{team.name}</td>
                                <td className="py-2 px-1 text-center font-extrabold">{team.pts}</td>
                                <td className="py-2 px-1 text-center">{team.pj}</td>
                                <td className="py-2 px-1 text-center hidden sm:table-cell text-green-400">{team.pg}</td>
                                <td className="py-2 px-1 text-center hidden sm:table-cell text-blue-400">{team.pe}</td>
                                <td className="py-2 px-1 text-center hidden sm:table-cell text-red-400">{team.pp}</td>
                                <td className="py-2 px-1 text-center">{team.gf}</td>
                                <td className="py-2 px-1 text-center">{team.gc}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Ranking de Goleadores */}
            <div className="bg-gray-800 p-5 rounded-2xl shadow-xl border border-gray-700 max-w-sm mx-auto">
                <h2 className="text-xl font-bold text-green-400 mb-4 text-center">Ranking de Goleadores (Top 10)</h2>
                <ul className="space-y-3">
                    {goalScorers.length === 0 && (
                        <p className="text-gray-400 text-center">Aún no hay goles registrados.</p>
                    )}
                    {goalScorers.map((scorer, index) => (
                        <li key={index} className="flex justify-between items-center bg-gray-700 p-3 rounded-lg border-l-4 border-yellow-500 shadow-md">
                            <div className="flex items-center">
                                <span className="font-bold text-lg mr-3 text-yellow-400">{index + 1}.</span>
                                <div>
                                    <p className="text-white font-semibold">{scorer.name}</p>
                                    <p className="text-xs text-gray-400">{scorer.teamName}</p>
                                </div>
                            </div>
                            <span className="bg-green-600 text-white font-bold px-3 py-1 rounded-full text-lg">
                                {scorer.goals}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

// 6. CANCHAS / SEDES
const VenuesSection = ({ venues, isLoggedIn, setVenues }) => {
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');

    const handleAddVenue = async (e) => {
        e.preventDefault();
        if (!name) return;

        try {
            const venueRef = collection(db, PUBLIC_COLLECTION_PATH, 'venues');
            await addDoc(venueRef, { name, location });
            setName('');
            setLocation('');
        } catch (e) {
            console.error("Error al añadir cancha:", e);
        }
    };

    const handleDeleteVenue = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta cancha?')) {
            try {
                const venueRef = doc(db, PUBLIC_COLLECTION_PATH, 'venues', id);
                await deleteDoc(venueRef);
            } catch (e) {
                console.error("Error al eliminar cancha:", e);
            }
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-white text-center">Gestión de Canchas y Sedes</h1>

            {/* Formulario de Registro (Admin Only) */}
            {isLoggedIn && (
                <form onSubmit={handleAddVenue} className="bg-gray-700 p-5 rounded-2xl shadow-xl space-y-3 max-w-lg mx-auto">
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">Registrar Nueva Sede</h2>
                    <input
                        type="text"
                        placeholder="Nombre de la Cancha (Ej: Estadio Primero de Mayo)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 bg-gray-600 text-white rounded-lg focus:ring-green-500 focus:outline-none"
                    />
                    <input
                        type="text"
                        placeholder="Ubicación o Dirección"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-3 bg-gray-600 text-white rounded-lg focus:ring-green-500 focus:outline-none"
                    />
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center">
                        <Plus size={20} className="mr-2" /> Añadir Sede
                    </button>
                </form>
            )}

            {/* Listado de Canchas */}
            <div className="space-y-4 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-white mb-3 text-center border-b border-gray-700 pb-2">Canchas de Juego ({venues.length})</h2>
                {venues.length === 0 && <p className="text-gray-400 text-center">No hay canchas registradas.</p>}
                {venues.map(venue => (
                    <div key={venue.id} className="bg-gray-800 p-4 rounded-xl shadow-lg flex justify-between items-center border-l-4 border-yellow-500">
                        <div>
                            <h3 className="text-xl font-bold text-white">{venue.name}</h3>
                            <p className="text-sm text-gray-400 flex items-center"><MapPin size={14} className="mr-1" /> {venue.location}</p>
                        </div>
                        {isLoggedIn && (
                            <button onClick={() => handleDeleteVenue(venue.id)} className="text-red-500 hover:text-red-400 transition" title="Eliminar Cancha">
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// 7. PATROCINADORES / SOCIOS
const SponsorsSection = ({ sponsors, isLoggedIn, setSponsors }) => {
    const [name, setName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');

    const handleAddSponsor = async (e) => {
        e.preventDefault();
        if (!name || !logoUrl) return;

        try {
            const sponsorRef = collection(db, PUBLIC_COLLECTION_PATH, 'sponsors');
            await addDoc(sponsorRef, { name, logoUrl });
            setName('');
            setLogoUrl('');
        } catch (e) {
            console.error("Error al añadir patrocinador:", e);
        }
    };

    const handleDeleteSponsor = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este patrocinador?')) {
            try {
                const sponsorRef = doc(db, PUBLIC_COLLECTION_PATH, 'sponsors', id);
                await deleteDoc(sponsorRef);
            } catch (e) {
                console.error("Error al eliminar patrocinador:", e);
            }
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-extrabold text-white text-center">Nuestros Socios Patrocinadores</h1>

            {/* Formulario de Registro (Admin Only) */}
            {isLoggedIn && (
                <form onSubmit={handleAddSponsor} className="bg-gray-700 p-5 rounded-2xl shadow-xl space-y-3 max-w-lg mx-auto">
                    <h2 className="text-xl font-bold text-yellow-400 mb-2">Añadir Nuevo Patrocinador</h2>
                    <input
                        type="text"
                        placeholder="Nombre del Patrocinador"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 bg-gray-600 text-white rounded-lg focus:ring-green-500 focus:outline-none"
                    />
                    <input
                        type="url"
                        placeholder="URL del Logo (Ej: https://ejemplo.com/logo.png)"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="w-full p-3 bg-gray-600 text-white rounded-lg focus:ring-green-500 focus:outline-none"
                    />
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 transition flex items-center justify-center">
                        <Plus size={20} className="mr-2" /> Añadir Socio
                    </button>
                </form>
            )}

            {/* Galería de Patrocinadores */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {sponsors.length === 0 && <p className="text-gray-400 text-center col-span-full">Aún no hay patrocinadores registrados.</p>}
                {sponsors.map(sponsor => (
                    <div key={sponsor.id} className="bg-white p-4 rounded-xl shadow-xl flex flex-col items-center justify-center transition hover:shadow-2xl hover:scale-[1.02] relative">
                        <img
                            src={sponsor.logoUrl}
                            alt={`Logo de ${sponsor.name}`}
                            className="w-full max-h-20 object-contain mb-3"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/150x50/34D399/ffffff?text=LOGO'; }}
                        />
                        <p className="text-sm text-gray-600 font-semibold">{sponsor.name}</p>
                        {isLoggedIn && (
                            <button
                                onClick={() => handleDeleteSponsor(sponsor.id)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition"
                                title="Eliminar Patrocinador"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};


// 8. CONTACTO
const ContactSection = () => {
    return (
        <div className="space-y-6 max-w-lg mx-auto">
            <h1 className="text-3xl font-extrabold text-white text-center">Contacto y Soporte</h1>

            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-yellow-500 space-y-4">
                <h2 className="text-xl font-bold text-yellow-400 flex items-center"><MapPin size={24} className="mr-2" /> Sede de la Liga</h2>
                <p className="text-gray-300">
                    Para información oficial, registro de equipos y consultas sobre partidos, por favor diríjase a nuestra oficina central:
                </p>
                <ul className="space-y-2 text-gray-400">
                    <li><span className="font-semibold text-white">Dirección:</span> Carrera 1 # 10-20, Montelíbano, Córdoba.</li>
                    <li><span className="font-semibold text-white">Teléfono:</span> (57) 4 762 1000</li>
                    <li><span className="font-semibold text-white">Email:</span> contacto@ligamontelibano.co</li>
                </ul>
            </div>

            <div className="bg-gray-800 p-6 rounded-2xl shadow-xl border-t-4 border-green-500 space-y-4">
                <h2 className="text-xl font-bold text-green-400 flex items-center"><Settings size={24} className="mr-2" /> Soporte Técnico</h2>
                <p className="text-gray-300">
                    Para reportar fallos en la aplicación, errores en los marcadores o problemas de acceso, contacte con el equipo de desarrollo:
                </p>
                <ul className="space-y-2 text-gray-400">
                    <li><span className="font-semibold text-white">Desarrollador:</span> Kevin - [Tu Nombre]</li>
                    <li><span className="font-semibold text-white">Contacto:</span> soporte@mi-app.dev</li>
                </ul>
            </div>
        </div>
    );
};


// --- COMPONENTE PRINCIPAL (APP) ---

const App = () => {
    const { teams, setTeams, matches, news, venues, setVenues, sponsors, setSponsors, currentUserId, isAuthReady } = useLigaData();
    const [activeTab, setActiveTab] = useState('home'); // home, teams, news, matches, standings, venues, sponsors, contact
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [adminLoginOpen, setAdminLoginOpen] = useState(false);
    const [playerProfileOpen, setPlayerProfileOpen] = useState(false);

    // Navegación
    const navItems = [
        { id: 'home', label: 'Inicio', icon: Home, component: HomeSection, props: { setAdminLoginOpen, setPlayerProfileOpen } },
        { id: 'teams', label: 'Equipos', icon: Users, component: TeamsSection, props: { setPlayerProfileOpen, matches } },
        { id: 'news', label: 'Noticias', icon: Newspaper, component: NewsSection },
        { id: 'matches', label: 'Partidos', icon: Swords, component: MatchesSection },
        { id: 'standings', label: 'Clasificación', icon: Award, component: StandingsSection },
        { id: 'venues', label: 'Canchas', icon: MapPin, component: VenuesSection },
        { id: 'sponsors', label: 'Socios', icon: Star, component: SponsorsSection },
        { id: 'contact', label: 'Contacto', icon: Settings, component: ContactSection },
    ];

    const ActiveComponent = navItems.find(item => item.id === activeTab)?.component;
    const activeProps = navItems.find(item => item.id === activeTab)?.props || {};

    // Propiedades comunes para todos los componentes
    const commonProps = {
        teams, setTeams, matches, news, venues, setVenues, sponsors, setSponsors, isLoggedIn, currentUserId
    };

    if (!isAuthReady) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-900">
                <p className="text-white text-xl flex items-center">
                    <Zap size={24} className="mr-2 animate-pulse text-yellow-400" /> Cargando Datos de la Liga...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center p-0 sm:p-4">

            {/* MODALES */}
            <AdminLoginModal
                isOpen={adminLoginOpen}
                onClose={() => setAdminLoginOpen(false)}
                onLoginSuccess={() => setIsLoggedIn(true)}
            />
             <PlayerProfileModal
                isOpen={playerProfileOpen}
                onClose={() => setPlayerProfileOpen(false)}
                teams={teams}
                setTeams={setTeams}
                currentUserId={currentUserId}
            />

            {/* ENCABEZADO Y CONECTIVIDAD */}
            <header className="w-full bg-gray-800 p-4 shadow-xl mb-4 max-w-4xl rounded-xl">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-black text-white flex items-center">
                        <img src="https://placehold.co/40x40/FFC700/064E3B?text=ML" alt="Logo ML" className="mr-2 rounded-full" />
                        Liga Montelíbano
                    </h1>
                    <div className="flex items-center space-x-3">
                        <span className="text-xs font-semibold text-green-400 bg-green-900/50 px-3 py-1 rounded-full">
                            DATOS EN TIEMPO REAL: Conectado a Firestore
                        </span>
                        {isLoggedIn ? (
                            <button
                                onClick={() => setIsLoggedIn(false)}
                                className="bg-red-500 text-white font-bold px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition"
                            >
                                Salir Admin
                            </button>
                        ) : (
                            <button
                                onClick={() => setAdminLoginOpen(true)}
                                className="bg-yellow-500 text-gray-900 font-bold px-3 py-1 rounded-lg text-sm hover:bg-yellow-600 transition flex items-center"
                            >
                                <LogIn size={16} className="mr-1" /> Acceso Admin
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* BARRA DE NAVEGACIÓN (Pestañas) */}
            <nav className="w-full mb-6 max-w-4xl bg-gray-800 rounded-2xl shadow-xl p-0.5 overflow-x-auto">
                <div className="flex justify-between space-x-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex-1 flex flex-col sm:flex-row items-center justify-center p-2 rounded-xl transition duration-200 text-center text-xs sm:text-sm font-semibold whitespace-nowrap ${
                                activeTab === item.id
                                    ? 'bg-yellow-500 text-gray-900 shadow-lg'
                                    : 'text-gray-300 hover:bg-gray-700'
                            }`}
                        >
                            <item.icon size={18} className="sm:mr-1 mb-0.5 sm:mb-0" />
                            {item.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* CONTENIDO DE LA PESTAÑA ACTIVA */}
            <main className="w-full max-w-4xl p-4 bg-gray-900 rounded-2xl min-h-[70vh]">
                {ActiveComponent && <ActiveComponent {...commonProps} {...activeProps} />}
            </main>
        </div>
    );
};
export default App;
