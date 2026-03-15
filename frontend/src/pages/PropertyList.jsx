import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { API_BASE_URL } from '../services/api';
import { FaEdit, FaTrash, FaPlus, FaUpload } from 'react-icons/fa';
import * as XLSX from 'xlsx';

const PropertyList = () => {
    const [properties, setProperties] = useState([]);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    
    // Excel Import States
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importWorkbook, setImportWorkbook] = useState(null);
    const [importSheets, setImportSheets] = useState([]);
    const [selectedSheet, setSelectedSheet] = useState('');
    const [removeDuplicates, setRemoveDuplicates] = useState(true);
    const [lastImportedIds, setLastImportedIds] = useState([]);
    const [previewProperties, setPreviewProperties] = useState([]);
    const [isPreviewStep, setIsPreviewStep] = useState(false);

    const fileInputRef = React.useRef(null);

    useEffect(() => {
        fetchProperties();
    }, []);


    const fetchProperties = async () => {
        try {
            const res = await api.get('/properties');
            setProperties(res.data);
        } catch (err) {
            console.error("Failed to fetch properties", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                setImportWorkbook(workbook);
                setImportSheets(workbook.SheetNames);
                setSelectedSheet(workbook.SheetNames[0]);
                setImportModalOpen(true);
            } catch (err) {
                console.error("Failed to read Excel file", err);
                alert("Failed to read Excel file. Please ensure it is a valid format.");
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImportConfirm = async () => {
        if (!importWorkbook || !selectedSheet) return;

        try {
            const worksheet = importWorkbook.Sheets[selectedSheet];
            const json = XLSX.utils.sheet_to_json(worksheet);

            let parsedProperties = json.map(row => {
                let lat = row['Latitude'] || row.latitude || null;
                let lng = row['Longitude'] || row.longitude || null;
                
                if (row['LONGITUDE,LATITUDE'] || row['LONGITUDE, LATITUDE']) {
                    const val = String(row['LONGITUDE,LATITUDE'] || row['LONGITUDE, LATITUDE']);
                    const parts = val.split(',');
                    if (parts.length >= 2) {
                        lng = parseFloat(parts[0].trim());
                        lat = parseFloat(parts[1].trim());
                    } else {
                        const spaceParts = val.split(' ');
                        if(spaceParts.length >= 2) {
                            lng = parseFloat(spaceParts[0].trim());
                            lat = parseFloat(spaceParts[1].trim());
                        }
                    }
                }

                return {
                    propertyName: row['PROPERTY NAME'] || row['Property Name'] || row.propertyName || '',
                    projectName: row['PROJECT CODE'] || row['Project Name'] || row.projectName || '',
                    category: filter !== 'All' ? filter : (row['TYPE'] || row['Category'] || row.category || 'Residential'),
                    location: row['LOCATION'] || row['Location'] || row.location || '',
                    price: row['PER SQFT PRICE'] || row['Price'] || row.price || null,
                    priceUnit: row['Price Unit'] || row.priceUnit || 'Lakhs',
                    dimensions: row['DIMENTION'] || row['Dimensions'] || row.dimensions || '',
                    configuration: row['Configuration'] || row.configuration || '',
                    status: row['Status'] || row.status || 'Available',
                    amenities: row['amenities'] || row['Amenities'] || row.amenities || '',
                    projectHighlights: row['Project Highlights'] || row.projectHighlights || '',
                    isVerified: row['Is Verified'] || row.isVerified || false,
                    possessionStatus: row['POSSETION STATUS'] || row['Possession Status'] || row.possessionStatus || 'Ready to Move',
                    furnishingStatus: row['Furnishing Status'] || row.furnishingStatus || 'Unfurnished',
                    bhk: row['BHK'] || row['BHK (Number)'] || row.bhk || null,
                    latitude: lat,
                    longitude: lng,
                    possessionTime: row['POSSETION TIME'] || row['Possession Time'] || row['Position Time'] || row.possessionTime || '',
                    developerName: row['Developer Name'] || row.developerName || '',
                    landParcel: row['LAND PARCLE'] || row['Land Parcel'] || row.landParcel || '',
                    floor: row['FLOOR'] || row['Floor'] || row.floor || '',
                    units: row['TOTAL NO OF UNITS'] || row['Units'] || row.units || '',
                    investmentType: row['Investment Type'] || row.investmentType || '',
                    reraNumber: row['RERA NO'] || row['RERA Number'] || row.reraNumber || '',
                    builderInfo: row['Builder Info'] || row.builderInfo || '',
                    description: row['DISCRIPTION'] || row['Description'] || row.description || ''
                };
            });

            if (removeDuplicates) {
                // Deduplicate within the imported file itself
                const uniqueMap = new Map();
                parsedProperties.forEach(p => {
                    const key = `${p.propertyName}`.toLowerCase().trim();
                    if (!uniqueMap.has(key)) {
                        uniqueMap.set(key, p);
                    }
                });
                parsedProperties = Array.from(uniqueMap.values());

                // Filter out properties that already exist in the database (by name)
                const existingNames = new Set(properties.map(p => (p.propertyName || '').toLowerCase().trim()));
                parsedProperties = parsedProperties.filter(p => !existingNames.has((p.propertyName || '').toLowerCase().trim()));
            }

            if (parsedProperties.length === 0) {
                alert("No new properties to import. All items in the sheet were duplicates.");
                return;
            }

            setPreviewProperties(parsedProperties);
            setIsPreviewStep(true);
        } catch (err) {
            console.error("Failed to import properties", err);
            alert("Failed to import properties. Please check the console and ensure your Excel file matches the required format.");
        } finally {
            // keep importing true if going to preview step, else false
        }
    };

    const handleFinalSubmit = async () => {
        setImporting(true);
        try {
            // Strip file objects from the properties before JSON bulk upload
            const pureProperties = previewProperties.map(_prop => {
                const p = { ..._prop };
                delete p.photosFiles;
                delete p.brochureFiles;
                delete p.floorPlanFiles;
                delete p.masterPlanFiles;
                return p;
            });

            const res = await api.post('/properties/bulk', { properties: pureProperties });
            const importedIds = res.data.importedIds;

            if (importedIds && importedIds.length === previewProperties.length) {
                setLastImportedIds(importedIds);

                // Now upload files for each property if any exist
                for (let i = 0; i < previewProperties.length; i++) {
                    const prop = previewProperties[i];
                    if (prop.photosFiles?.length > 0 || prop.brochureFiles?.length > 0 || prop.floorPlanFiles?.length > 0 || prop.masterPlanFiles?.length > 0) {
                        const formData = new FormData();
                        
                        // Append all non-file fields to ensure PUT doesn't overwrite with nulls
                        Object.keys(prop).forEach(key => {
                            if (!['photosFiles', 'brochureFiles', 'floorPlanFiles', 'masterPlanFiles'].includes(key) && prop[key] !== null && prop[key] !== undefined) {
                                formData.append(key, prop[key]);
                            }
                        });

                        if (prop.photosFiles) Array.from(prop.photosFiles).forEach(file => formData.append('photos', file));
                        if (prop.brochureFiles) Array.from(prop.brochureFiles).forEach(file => formData.append('brochure', file));
                        if (prop.floorPlanFiles) Array.from(prop.floorPlanFiles).forEach(file => formData.append('floorPlan', file));
                        if (prop.masterPlanFiles) Array.from(prop.masterPlanFiles).forEach(file => formData.append('masterPlan', file));

                        try {
                            await api.put(`/properties/${importedIds[i]}`, formData);
                        } catch (uploadErr) {
                            console.error(`Failed to upload media for property ${prop.propertyName}`, uploadErr);
                        }
                    }
                }
            }

            alert(res.data.message + (importedIds?.length > 0 ? ". Attached media files were also uploaded." : ""));
            setImportModalOpen(false);
            setIsPreviewStep(false);
            setPreviewProperties([]);
            fetchProperties();
        } catch (err) {
            console.error("Failed to import properties", err);
            alert("Failed to import properties. Please check the console and ensure your Excel file matches the required format.");
        } finally {
            setImporting(false);
            setImportWorkbook(null);
        }
    };

    const handlePreviewChange = (index, field, value) => {
        const updated = [...previewProperties];
        updated[index] = { ...updated[index], [field]: value };
        setPreviewProperties(updated);
    };

    const handleFilePreviewChange = (index, field, files) => {
        const updated = [...previewProperties];
        updated[index] = { ...updated[index], [field]: files };
        setPreviewProperties(updated);
    };
    
    const handleRemovePreviewItem = (index) => {
        const updated = [...previewProperties];
        updated.splice(index, 1);
        setPreviewProperties(updated);
        if (updated.length === 0) {
            setIsPreviewStep(false);
            setImportModalOpen(false);
            setImporting(false);
            setImportWorkbook(null);
        }
    };

    const handleRevertImport = async () => {
        if (lastImportedIds.length === 0) return;
        if (window.confirm(`Are you sure you want to revert the last import of ${lastImportedIds.length} properties?`)) {
            try {
                const res = await api.delete('/properties/bulk', { data: { ids: lastImportedIds } });
                alert(res.data.message);
                setLastImportedIds([]);
                fetchProperties();
            } catch (err) {
                console.error("Failed to revert import", err);
                alert("Failed to revert import");
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this property?")) {
            try {
                await api.delete(`/properties/${id}`);
                setProperties(properties.filter(p => p.id !== id));
            } catch (err) {
                console.error("Failed to delete property", err);
                alert("Failed to delete property");
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Properties</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {lastImportedIds.length > 0 && (
                        <button 
                            onClick={handleRevertImport}
                            className="btn btn-danger" 
                            style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Undo Last Import ({lastImportedIds.length})
                        </button>
                    )}
                    <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        onChange={handleFileUpload} 
                        style={{ display: 'none' }} 
                        ref={fileInputRef} 
                    />
                    <button 
                        onClick={() => fileInputRef.current && fileInputRef.current.click()} 
                        className="btn btn-primary" 
                        style={{ display: 'flex', alignItems: 'center', backgroundColor: '#10b981' }}
                        disabled={importing}
                    >
                        <FaUpload style={{ marginRight: '5px' }} /> {importing ? 'Importing...' : 'Import from Excel'}
                    </button>
                    <Link to="/properties/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center' }}>
                        <FaPlus style={{ marginRight: '5px' }} /> Add Property
                    </Link>
                </div>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['All', 'Villa', 'Plot', 'Farm Land', 'Residential', 'Resale', 'Rental'].map(cat => {
                        const count = cat === 'All' ? properties.length : properties.filter(p => p.category === cat).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    backgroundColor: filter === cat ? '#3b82f6' : '#e5e7eb',
                                    color: filter === cat ? 'white' : '#374151',
                                    cursor: 'pointer',
                                    fontWeight: filter === cat ? 'bold' : 'normal',
                                    display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                {cat} 
                                <span style={{
                                    backgroundColor: filter === cat ? 'rgba(255,255,255,0.2)' : '#cbd5e1',
                                    padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold'
                                }}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input 
                        type="text" 
                        placeholder="Search by property, project, or price..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', minWidth: '250px' }}
                    />
                </div>
            </div>

            <div className="card table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                            <th style={{ padding: '12px' }}>Image</th>
                            <th style={{ padding: '12px' }}>Property Name</th>
                            <th style={{ padding: '12px' }}>Category</th>
                            <th style={{ padding: '12px' }}>Location</th>
                            <th style={{ padding: '12px' }}>Price</th>
                            <th style={{ padding: '12px' }}>Brochure</th>
                            <th style={{ padding: '12px' }}>Status</th>
                            <th style={{ padding: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {properties
                            .filter(p => filter === 'All' || p.category === filter)
                            .filter(p => {
                                if (!searchTerm) return true;
                                const term = searchTerm.toLowerCase();
                                const propName = (p.propertyName || '').toLowerCase();
                                const projName = (p.projectName || '').toLowerCase();
                                const priceStr = String(p.price || '').toLowerCase();
                                return propName.includes(term) || projName.includes(term) || priceStr.includes(term);
                            })
                            .sort((a, b) => (a.propertyName || '').localeCompare(b.propertyName || ''))
                            .map(property => (
                            <tr key={property.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '12px' }}>
                                    {property.photos && property.photos.length > 0 ? (
                                        <img src={`${API_BASE_URL}${property.photos[0]}`} alt={property.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                        <div style={{ width: '50px', height: '50px', backgroundColor: '#e5e7eb', borderRadius: '4px' }}></div>
                                    )}
                                </td>
                                <td style={{ padding: '12px' }}>{property.propertyName}</td>
                                <td style={{ padding: '12px' }}>{property.category}</td>
                                <td style={{ padding: '12px' }}>{property.location}</td>
                                <td style={{ padding: '12px' }}>{property.price} {property.priceUnit}</td>
                                <td style={{ padding: '12px' }}>
                                    {property.brochure && property.brochure.length > 0 ? (
                                        <a href={`${API_BASE_URL}${property.brochure[0]}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                                            View Brochure
                                        </a>
                                    ) : (
                                        <span style={{ color: '#9ca3af' }}>None</span>
                                    )}
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        backgroundColor:
                                            property.status === 'Available' ? '#d1fae5' :
                                                property.status === 'Pending' ? '#fee2e2' :
                                                    property.status === 'EOI' ? '#dbeafe' : // Blue for EOI
                                                        property.status === 'RTMI' ? '#fef3c7' : // Yellow for RTMI
                                                            '#f3f4f6', // Gray for Sold or others
                                        color:
                                            property.status === 'Available' ? '#065f46' :
                                                property.status === 'Pending' ? '#991b1b' :
                                                    property.status === 'EOI' ? '#1e40af' :
                                                        property.status === 'RTMI' ? '#92400e' :
                                                            '#374151'
                                    }}>
                                        {property.status}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <Link to={`/properties/edit/${property.id}`} style={{ marginRight: '10px', color: '#2563eb' }}>
                                        <FaEdit />
                                    </Link>
                                    <button onClick={() => handleDelete(property.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                        <FaTrash />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {properties.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No properties found.</p>}
            </div>

            {/* Import Options Modal */}
            {importModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', padding: '24px', borderRadius: '8px',
                        width: isPreviewStep ? '95%' : '400px', 
                        maxWidth: isPreviewStep ? '1200px' : '90%', 
                        maxHeight: '90vh', overflowY: 'auto',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        {!isPreviewStep ? (
                            <>
                                <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem' }}>Import Options</h2>
                                
                                <div style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Select Sheet to Import</label>
                                    <select 
                                        value={selectedSheet}
                                        onChange={(e) => setSelectedSheet(e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    >
                                        {importSheets.map(sheet => (
                                            <option key={sheet} value={sheet}>{sheet}</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={removeDuplicates}
                                            onChange={(e) => setRemoveDuplicates(e.target.checked)}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <span>Remove Sub-Sheet Duplicates & Skip Existing</span>
                                    </label>
                                    <p style={{ margin: '4px 0 0 24px', fontSize: '0.875rem', color: '#6b7280' }}>
                                        Properties with the exact same 'Property Name' will be ignored.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button 
                                        onClick={() => {
                                            setImportModalOpen(false);
                                            setImportWorkbook(null);
                                            setImporting(false);
                                        }}
                                        style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleImportConfirm}
                                        style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Preview Import
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.25rem' }}>Review & Edit Properties</h2>
                                <p style={{ marginBottom: '20px', color: '#6b7280' }}>Please review the {previewProperties.length} properties below before finalizing the import. You can edit the values directly in the fields.</p>
                                
                                <div style={{ overflowX: 'auto', marginBottom: '20px', paddingBottom: '10px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '4500px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left', backgroundColor: '#f9fafb' }}>
                                                <th style={{ padding: '12px' }}>Property Name</th>
                                                <th style={{ padding: '12px' }}>Project Name</th>
                                                <th style={{ padding: '12px' }}>Category</th>
                                                <th style={{ padding: '12px' }}>Price</th>
                                                <th style={{ padding: '12px' }}>Price Unit</th>
                                                <th style={{ padding: '12px' }}>Location</th>
                                                <th style={{ padding: '12px' }}>Upload Images</th>
                                                <th style={{ padding: '12px' }}>Upload Brochure</th>
                                                <th style={{ padding: '12px' }}>Upload Floor Plan</th>
                                                <th style={{ padding: '12px' }}>Upload Master Plan</th>
                                                <th style={{ padding: '12px' }}>Dimensions</th>
                                                <th style={{ padding: '12px' }}>Configuration</th>
                                                <th style={{ padding: '12px' }}>Status</th>
                                                <th style={{ padding: '12px' }}>Possession Status</th>
                                                <th style={{ padding: '12px' }}>Possession Time</th>
                                                <th style={{ padding: '12px' }}>Furnishing</th>
                                                <th style={{ padding: '12px' }}>BHK</th>
                                                <th style={{ padding: '12px' }}>Land Parcel</th>
                                                <th style={{ padding: '12px' }}>Floor</th>
                                                <th style={{ padding: '12px' }}>Units</th>
                                                <th style={{ padding: '12px' }}>Lat</th>
                                                <th style={{ padding: '12px' }}>Lng</th>
                                                <th style={{ padding: '12px' }}>Amenities</th>
                                                <th style={{ padding: '12px' }}>Highlights</th>
                                                <th style={{ padding: '12px' }}>Investment Type</th>
                                                <th style={{ padding: '12px' }}>RERA Number</th>
                                                <th style={{ padding: '12px' }}>Builder Info</th>
                                                <th style={{ padding: '12px' }}>Description</th>
                                                <th style={{ padding: '12px', position: 'sticky', right: 0, backgroundColor: '#f9fafb', zIndex: 1, boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewProperties.map((prop, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.propertyName || ''} onChange={e => handlePreviewChange(idx, 'propertyName', e.target.value)} style={{ width: '150px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.projectName || ''} onChange={e => handlePreviewChange(idx, 'projectName', e.target.value)} style={{ width: '120px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <select value={prop.category || ''} onChange={e => handlePreviewChange(idx, 'category', e.target.value)} style={{ width: '120px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                                            {['Villa', 'Plot', 'Farm Land', 'Commercial', 'Residential', 'Resale', 'Rental'].map(c => <option key={c} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.price || ''} onChange={e => handlePreviewChange(idx, 'price', e.target.value)} style={{ width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.priceUnit || ''} onChange={e => handlePreviewChange(idx, 'priceUnit', e.target.value)} style={{ width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.location || ''} onChange={e => handlePreviewChange(idx, 'location', e.target.value)} style={{ width: '150px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="file" multiple accept="image/*" onChange={e => handleFilePreviewChange(idx, 'photosFiles', e.target.files)} style={{ width: '180px', fontSize: '0.8rem' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="file" multiple accept=".pdf,.doc,.docx" onChange={e => handleFilePreviewChange(idx, 'brochureFiles', e.target.files)} style={{ width: '180px', fontSize: '0.8rem' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={e => handleFilePreviewChange(idx, 'floorPlanFiles', e.target.files)} style={{ width: '180px', fontSize: '0.8rem' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={e => handleFilePreviewChange(idx, 'masterPlanFiles', e.target.files)} style={{ width: '180px', fontSize: '0.8rem' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.dimensions || ''} onChange={e => handlePreviewChange(idx, 'dimensions', e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.configuration || ''} onChange={e => handlePreviewChange(idx, 'configuration', e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <select value={prop.status || ''} onChange={e => handlePreviewChange(idx, 'status', e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
                                                            {['Available', 'Sold', 'Pending', 'EOI', 'RTMI'].map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.possessionStatus || ''} onChange={e => handlePreviewChange(idx, 'possessionStatus', e.target.value)} style={{ width: '120px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.possessionTime || ''} onChange={e => handlePreviewChange(idx, 'possessionTime', e.target.value)} style={{ width: '120px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.furnishingStatus || ''} onChange={e => handlePreviewChange(idx, 'furnishingStatus', e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="number" value={prop.bhk || ''} onChange={e => handlePreviewChange(idx, 'bhk', e.target.value)} style={{ width: '60px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.landParcel || ''} onChange={e => handlePreviewChange(idx, 'landParcel', e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.floor || ''} onChange={e => handlePreviewChange(idx, 'floor', e.target.value)} style={{ width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.units || ''} onChange={e => handlePreviewChange(idx, 'units', e.target.value)} style={{ width: '80px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="number" step="any" value={prop.latitude || ''} onChange={e => handlePreviewChange(idx, 'latitude', e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="number" step="any" value={prop.longitude || ''} onChange={e => handlePreviewChange(idx, 'longitude', e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.amenities || ''} onChange={e => handlePreviewChange(idx, 'amenities', e.target.value)} style={{ width: '150px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.projectHighlights || ''} onChange={e => handlePreviewChange(idx, 'projectHighlights', e.target.value)} style={{ width: '150px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.investmentType || ''} onChange={e => handlePreviewChange(idx, 'investmentType', e.target.value)} style={{ width: '120px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.reraNumber || ''} onChange={e => handlePreviewChange(idx, 'reraNumber', e.target.value)} style={{ width: '100px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.builderInfo || ''} onChange={e => handlePreviewChange(idx, 'builderInfo', e.target.value)} style={{ width: '120px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px' }}>
                                                        <input type="text" value={prop.description || ''} onChange={e => handlePreviewChange(idx, 'description', e.target.value)} style={{ width: '150px', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                                    </td>
                                                    <td style={{ padding: '8px', textAlign: 'center', position: 'sticky', right: 0, backgroundColor: 'white', zIndex: 1, boxShadow: '-2px 0 5px rgba(0,0,0,0.05)' }}>
                                                        <button onClick={() => handleRemovePreviewItem(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}><FaTrash size={16} /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Total properties ready: <strong>{previewProperties.length}</strong></span>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => setIsPreviewStep(false)}
                                            style={{ padding: '8px 16px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Back
                                        </button>
                                        <button 
                                            onClick={handleFinalSubmit}
                                            style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Submit Properties
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyList;
