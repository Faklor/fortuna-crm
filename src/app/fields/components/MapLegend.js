export default function MapLegend({ mapType, opacity, setOpacity, legend }) {
    if (!legend || mapType === 'satellite') return null;
  
    return (
      <div className="map-legend">
        <h4>{legend.title}</h4>
        <p>{legend.description}</p>
        <div className="legend-gradient">
          <span>{legend.min}</span>
          <div className={`gradient-bar ${mapType}-gradient`}></div>
          <span>{legend.max}</span>
        </div>
        <div className="opacity-control">
          <label>Прозрачность:</label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.1" 
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
          />
        </div>
      </div>
    );
  }