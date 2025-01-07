import { useState, useEffect } from 'react';
import axios from 'axios';
import '../scss/fieldSeasons.scss';

function FieldSeasons({ field, onClose, onUpdate }) {
    const [availableSeasons, setAvailableSeasons] = useState([]);
    const [selectedSeasons, setSelectedSeasons] = useState(field.seasons || []);

    useEffect(() => {
        const fetchSeasons = async () => {
            try {
                const response = await axios.get('/api/fields/season');
                setAvailableSeasons(response.data);
            } catch (error) {
                console.error('Error fetching seasons:', error);
            }
        };
        fetchSeasons();
    }, []);

    const handleSave = async () => {
        try {
            const response = await axios.put(`/api/fields/${field._id}/seasons`, {
                seasons: selectedSeasons
            });
            onUpdate(response.data);
            onClose();
        } catch (error) {
            console.error('Error updating field seasons:', error);
        }
    };

    return (
        <div className="field-seasons-modal">
            <h3>Управление сезонами поля</h3>
            <div className="seasons-list">
                {availableSeasons.map(season => (
                    <label key={season._id} className="season-checkbox">
                        <input
                            type="checkbox"
                            checked={selectedSeasons.includes(season.name)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedSeasons([...selectedSeasons, season.name]);
                                } else {
                                    setSelectedSeasons(selectedSeasons.filter(s => s !== season.name));
                                }
                            }}
                        />
                        {season.name}
                    </label>
                ))}
            </div>
            <div className="button-group">
                <button onClick={handleSave}>Сохранить</button>
                <button onClick={onClose}>Отмена</button>
            </div>
        </div>
    );
}

export default FieldSeasons; 