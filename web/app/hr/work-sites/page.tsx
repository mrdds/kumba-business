'use client';
import { useState, useEffect } from 'react';
import { getWorkSites, createWorkSite, updateWorkSite, deleteWorkSite } from '../../../services/api';
import { MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function WorkSitesPage() {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', latitude: '', longitude: '', radius: 50 });

    const fetchSites = async () => {
        try {
            const data = await getWorkSites();
            setSites(data);
        } catch (error) {
            console.error('Failed to fetch work sites', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toString(),
                    longitude: position.coords.longitude.toString()
                }));
            },
            (error) => {
                console.error("Error getting location:", error);
                alert("Impossible d'obtenir votre position. Veuillez vérifier vos autorisations.");
            }
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (!formData.name || !formData.latitude || !formData.longitude) {
            alert("Veuillez remplir tous les champs !");
            return;
        }

        const payload = {
            name: formData.name,
            latitude: parseFloat(formData.latitude as string),
            longitude: parseFloat(formData.longitude as string),
            radius: parseInt(formData.radius as unknown as string, 10)
        };

        try {
            if (formData.id) {
                await updateWorkSite(formData.id, payload);
            } else {
                await createWorkSite(payload);
            }
            setIsFormOpen(false);
            setFormData({ id: null, name: '', latitude: '', longitude: '', radius: 50 });
            fetchSites();
        } catch (error) {
            console.error('Failed to save work site', error);
            alert("Erreur lors de l'enregistrement !");
        }
    };

    const handleEdit = (site: any) => {
        setFormData(site);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce site ?")) {
            try {
                await deleteWorkSite(id);
                fetchSites();
            } catch (error) {
                console.error("Failed to delete work site", error);
            }
        }
    };

    if (loading) return <div className="p-8">Chargement...</div>;

    return (
        <div className="p-6">
            <div className="mb-4">
                <Link href="/dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-black font-medium group transition-colors">
                    <ArrowLeft size={16} className="mr-1 transition-transform group-hover:-translate-x-1" />
                    Retour au Dashboard HR
                </Link>
            </div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Sites de Travail</h1>
                <button
                    onClick={() => {
                        setFormData({ id: null, name: '', latitude: '', longitude: '', radius: 50 });
                        setIsFormOpen(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700"
                >
                    + Ajouter un Site
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-xl shadow mb-8 border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">{formData.id ? "Modifier le Site" : "Nouveau Site"}</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nom du Site</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Ex: Siège Social" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Rayon (mètres)</label>
                            <input type="number" name="radius" value={formData.radius} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Ex: 50" />
                        </div>
                        <div className="md:col-span-2">
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-sm font-bold text-gray-700">Coordonnées GPS</label>
                                <button
                                    type="button"
                                    onClick={handleGetLocation}
                                    className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded font-medium transition-colors"
                                >
                                    <MapPin size={16} /> Me localiser
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Latitude (Ex: 5.359951)" />
                                </div>
                                <div>
                                    <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} className="w-full border p-2 rounded" placeholder="Longitude (Ex: -4.008256)" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded text-red-600 hover:bg-red-50 font-bold">Annuler</button>
                        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700">Enregistrer</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow border border-gray-100 p-6 overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-gray-500 border-b">
                            <th className="pb-2">Nom</th>
                            <th className="pb-2">Latitude</th>
                            <th className="pb-2">Longitude</th>
                            <th className="pb-2">Rayon</th>
                            <th className="pb-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sites.length === 0 ? (
                            <tr><td colSpan={5} className="py-4 text-center text-gray-500">Aucun site enregistré.</td></tr>
                        ) : (
                            sites.map((site: any) => (
                                <tr key={site.id} className="border-b last:border-0 border-gray-50">
                                    <td className="py-3 font-medium">{site.name}</td>
                                    <td className="py-3">{site.latitude}</td>
                                    <td className="py-3">{site.longitude}</td>
                                    <td className="py-3">{site.radius}m</td>
                                    <td className="py-3 flex gap-2">
                                        <button onClick={() => handleEdit(site)} className="text-blue-600 text-sm font-bold">Modifier</button>
                                        <button onClick={() => handleDelete(site.id)} className="text-red-500 text-sm font-bold ml-2">Supprimer</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
