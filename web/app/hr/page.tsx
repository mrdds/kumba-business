'use client';
import { useState, useEffect } from 'react';
import { getAttendance, getAdvances, approveAdvance, rejectAdvance } from '../../services/api';

export default function HRPage() {
    const [attendance, setAttendance] = useState([]);
    const [advances, setAdvances] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [att, adv] = await Promise.all([getAttendance(), getAdvances()]);
            setAttendance(att);
            setAdvances(adv);
        } catch (error) {
            console.error('Failed to fetch HR data', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id: number) => {
        await approveAdvance(id);
        fetchData();
    };

    const handleReject = async (id: number) => {
        await rejectAdvance(id);
        fetchData();
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">HR Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Attendance */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">Today's Attendance</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-2">Employee</th>
                                    <th className="pb-2">In</th>
                                    <th className="pb-2">Out</th>
                                    <th className="pb-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendance.length === 0 ? (
                                    <tr><td colSpan={4} className="py-4 text-center text-gray-500">No attendance records today.</td></tr>
                                ) : (
                                    attendance.map((rec: any) => (
                                        <tr key={rec.id} className="border-b last:border-0 border-gray-50">
                                            <td className="py-3 font-medium">{rec.employee_name}</td>
                                            <td className="py-3 text-green-600">{rec.check_in || '-'}</td>
                                            <td className="py-3 text-red-500">{rec.check_out || '-'}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${rec.status === 'LATE' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                    {rec.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Salary Advances */}
                <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
                    <h2 className="text-xl font-bold mb-4">Advance Requests</h2>
                    <div className="space-y-4">
                        {advances.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No pending requests.</p>
                        ) : (
                            advances.map((adv: any) => (
                                <div key={adv.id} className="border border-gray-100 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold">{adv.employee_name}</p>
                                            <p className="text-sm text-gray-500">{adv.request_date} • {adv.reason || 'No reason'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-600">${adv.amount}</p>
                                            <span className={`text-xs font-bold ${adv.status === 'PENDING' ? 'text-yellow-600' : 'text-gray-500'}`}>{adv.status}</span>
                                        </div>
                                    </div>

                                    {adv.status === 'PENDING' && (
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => handleApprove(adv.id)}
                                                className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm font-bold"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleReject(adv.id)}
                                                className="flex-1 bg-red-100 text-red-600 py-2 rounded hover:bg-red-200 text-sm font-bold"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
