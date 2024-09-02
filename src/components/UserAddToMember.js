import React, { useState, useEffect } from 'react';
import { Spinner, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosSetup';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext'; 


const UserMember = () => {
    const [userData, setUserData] = useState('');
    const [dateNaissance, setDateNaissance] = useState('');
    const [pereName, setPereName] = useState();
    const [mereName, setMereName] = useState();
    const [isMarried, setIsMarried] = useState('');
    const [gender, setGender] = useState('');
    const [religion, setReligion] = useState('');
    const [bloodGroup, setBloodGroup] = useState('');
    const [electrophoresis, setElectrophoresis] = useState('');
    const [signFa, setSignFA] = useState('');
    const [conjointName, setConjointName] = useState();
    const [metier, setMetier] = useState('');
    const [linkTypes, setLinkTypes] = useState([]);
    const [selectedLinkType, setSelectedLinkType] = useState('');
    const [members, setMembers] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { role } = useAuth(); // Récupérez les informations de l'utilisateur
    const isAdmin = role === 'ADMIN'; // Déterminez si l'utilisateur est un administrateur
    const [adminInfo, setAdminInfo] = useState(null); // Ajouter un état pour stocker les informations de l'admin
    
    const navigate = useNavigate(); 

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await axiosInstance.get('/user/member/tous');
                setMembers(response.data);
            } catch (error) {
                console.error('Erreur lors de la récupération des membres', error);
            }
        };
        fetchMembers();
    }, []);

    useEffect(() => {
        const fetchLinkTypes = async () => {
            try {
                const response = await axiosInstance.get('/utils/typesDeLien');
                setLinkTypes(response.data);
            } catch (error) {
                console.log('Erreur lors de la récupération des types de liens:', error);
            }
        };
        fetchLinkTypes();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const userResponse = await axiosInstance.get('/utils/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setUserData(userResponse.data.user);

                if (userData?.role === 'ADMIN') {
                    const adminResponse = await axiosInstance.get('/utils/infos', {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    setAdminInfo(adminResponse.data);
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des données:', error.response?.data || error.message);
            }
        };
        fetchData();
    }, [isAdmin]);

    const checkIfMemberExists = async (firstName, dateNaissance, gender, electrophoresis, bloodGroup) => {
        try {
          const response = await axiosInstance.get('/user/member/tous', {
            params: { prenom: firstName, date_de_naissance: dateNaissance, sexe: gender, electrophorese: electrophoresis, groupe_sanguin: bloodGroup }
          });
          return response.data.exists; // Supposons que la réponse contient un champ 'exists'
        } catch (error) {
          console.error('Erreur lors de la vérification de l\'existence du membre:', error);
          return false;
        }
    };

      const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
    
        // Vérifier si le membre existe déjà
        const memberExists = await checkIfMemberExists(userData.prenom, dateNaissance, gender,electrophoresis, bloodGroup);
        if (memberExists) {
            setMessage('Un membre avec ces informations existe déjà.');
            toast.error('Un membre avec ces informations existe déjà.');
            setLoading(false);
            setTimeout(() => navigate('/home'), 3000); // Redirection vers la page d'accueil après 3 secondes
            return;
        }
    
        // 
        const payload = {
            prenom: userData?.prenom,
            nom: userData?.nom,
            date_de_naissance: dateNaissance,
            id_pere: pereName,
            id_mere: mereName,
            statut_matrimonial: isMarried,
            sexe: gender,
            religion,
            groupe_sanguin: bloodGroup,
            electrophorese: electrophoresis,
            signe_du_fa: signFa,
            conjoint: conjointName,
            profession: metier
        };
        if (userData?.role !== 'ADMIN') {
            payload.type_de_lien = selectedLinkType;
        }
    
        try {
            const token = localStorage.getItem('token');
            const endpoint = isAdmin 
                    ? `/admin/member/new-member` 
                    : `/user/member/new-member`;
            const response = await axiosInstance.post(`/admin/member/new-member`, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            console.log('Réponse du serveur:', response);
    
            setMessage('Ajout réussie! Votre profil a été modifier avec succès.');
            toast.success('Ajout réussi! Votre profil a été modifier avec succès.');
            resetForm();
            setTimeout(() => navigate('/home'), 3000); // Rediriger après l'ajout réussi
        } catch (error) {
            const errorMessage = error.response?.data?.Message || 'Une erreur est survenue';
            setMessage(errorMessage);
            if (errorMessage === 'Cette personne est déja membre de la famille') {
                setLoading(false);
                setTimeout(() => navigate('/home'), 3000)
                return;
            }
            toast.error(errorMessage);
            console.log(error);
        } finally {
            setLoading(false);
        }
    };
    const handleCancel = () => {
        if (window.confirm('Êtes-vous sûr de vouloir annuler ? Toutes les modifications non enregistrées seront perdues.')) {
            resetForm();
            navigate('/home'); // Vous pourriez vouloir naviguer vers une autre route si nécessaire
        }
    };

    const resetForm = () => {
        setDateNaissance('');
        setPereName();
        setMereName();
        setIsMarried('');
        setGender('');
        setReligion('');
        setBloodGroup('');
        setElectrophoresis('');
        setSignFA('');
        setConjointName();
        setSelectedLinkType('');
        setMetier('');
        setMessage('');
    };

   // Assumer que l'admin est toujours connecté
//    const isAdmin = true; // Cette valeur devrait être définie en fonction de la logique d'authentification réelle

    return (
        <div className="register-member-container"> 
            <h2>Complétez vos informations</h2>
            {message && <p>{message}</p>}
            {loading && <Spinner animation="border" />}
            {!isAdmin && adminInfo && (
                <Alert variant="info">
                    <p>Vous êtes connecté en tant qu'utilisateur. Voici les informations de l'administrateur {adminInfo.nom} {adminInfo.prenom}.</p>
                </Alert>
            )}
            <form onSubmit={handleSubmit}>
                <fieldset>
                    <legend>Informations générales</legend>
                    <div>
                        <label>Nom :</label>
                        <input
                            type="text"
                            value={userData?.nom}
                            required
                            readOnly
                        />
                    </div>
                    <div>
                        <label>Prénom :</label>
                        <input
                            type="text"
                            value={userData?.prenom}
                            required
                            readOnly
                        />
                    </div>
                    <div>
                        <label>Sexe :</label>
                        <select
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            required
                        >
                            <option value="">Sélectionner...</option>
                            <option value="Masculin">Masculin</option>
                            <option value="Feminin">Féminin</option>
                        </select>
                    </div>
                    <div>
                        <label>Date de naissance :</label>
                        <input
                            type="date"
                            value={dateNaissance}
                            onChange={(e) => setDateNaissance(e.target.value)}
                            required
                        />
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Informations des parents :</legend>
                    <div>
                        <label>Père:</label>
                        <select
                            value={pereName}
                            onChange={(e) => setPereName(e.target.value)}
                        >
                            <option value="">Sélectionner un membre...</option>
                            {members?.map((member) => (
                                <option key={member._id} value={member._id}>
                                    {member.prenom} {member.nom}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Mère:</label>
                        <select
                            value={mereName}
                            onChange={(e) => setMereName(e.target.value)}
                        >
                            <option value="">Sélectionner un membre...</option>
                            {members?.map((member) => (
                                <option key={member._id} value={member._id}>
                                    {member.prenom} {member.nom}
                                </option>
                            ))}
                        </select>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Autres informations</legend>
                    {userData?.role !== 'ADMIN' && (
                        <Form.Group>
                            <Form.Label>Type de lien :</Form.Label>
                            <Form.Control
                                as="select"
                                value={selectedLinkType}
                                onChange={(e) => setSelectedLinkType(e.target.value)}
                                required
                            >
                                <option value="">Sélectionner un type de lien...</option>
                                {linkTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
                    )}
                    <div>
                        <label>État matrimonial :</label>
                        <select
                            value={isMarried}
                            onChange={(e) => setIsMarried(e.target.value)}
                            required
                        >
                            <option value="">Sélectionner...</option>
                            <option value="Marie(e)">Marie(e)</option>
                            <option value="Celibataire">Celibataire</option>
                            <option value="Divorce(e)">Divorce(e)</option>
                            <option value="Veuf(ve)">Veuf(ve)</option>
                        </select>
                    </div>
                    {isMarried === 'Marie(e)' && (
                        <div>
                            <label>Nom du conjoint :</label>
                            <select
                                value={conjointName}
                                onChange={(e) => setConjointName(e.target.value)}
                            >
                                <option value="">Sélectionner un membre...</option>
                            {members?.map((member) => (
                                <option key={member._id} value={member._id}>
                                    {member.prenom} {member.nom}
                                </option>
                            ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label>Profession :</label>
                        <input
                            type="text"
                            value={metier}
                            onChange={(e) => setMetier(e.target.value)}
                        />
                    </div>
                    <div>
                        <label>Religion :</label>
                        <select
                            value={religion}
                            onChange={(e) => setReligion(e.target.value)}
                        >
                            <option value="">Sélectionner...</option>
                            <option value="Vodouisant">Vodouisant</option>
                            <option value="Christianisme">Christianisme</option>
                            <option value="Islam">Islam</option>
                            <option value="Hindouisme">Hindouisme</option>
                            <option value="Bouddhisme">Bouddhisme</option>
                            <option value="Judaisme">Judaïsme</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                    <div>
                        <label>Groupe sanguin :</label>
                        <select
                            value={bloodGroup}
                            onChange={(e) => setBloodGroup(e.target.value)}
                        >
                            <option value="">Sélectionner...</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                    <div>
                        <label>Signe du Fâ :</label>
                        <input
                            type="text"
                            value={signFa}
                            onChange={(e) => setSignFA(e.target.value)}
                        />
                    </div>
                    <div>
                        <label>Électrophorèse :</label>
                        <select
                            value={electrophoresis}
                            onChange={(e) => setElectrophoresis(e.target.value)}
                        >
                            <option value="">Sélectionner...</option>
                            <option value="AA">AA</option>
                            <option value="AS">AS</option>
                            <option value="SC">SC</option>
                            <option value="SS">SS</option>
                            <option value="Autre">Autre</option>
                        </select>
                    </div>
                </fieldset>
                <div className="form-buttons">
                <button type="submit">Ajouter</button>
                <button type="button" onClick={handleCancel}>Annuler</button>
            </div>
        </form>
        <ToastContainer />
    </div>
);
};

export default UserMember;
