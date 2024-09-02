//h.js c'est un exemplaire de profil sur lequel je suis en train de travailler
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../services/axiosSetup';
import { useAuth } from '../context/AuthContext';
import { useFamily } from '../context/FamilyContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Profiles = () => {
    const { user } = useAuth();
    const { familyData } = useFamily();
    const [formData, setFormData] = useState({
        firstName: '',
        dateNaissance: '',
        pereName: '',
        mereName: '',
        isMarried: '',
        gender: '',
        religion: '',
        bloodGroup: '',
        electrophoresis: '',
        signFa: '',
        conjointName: '',
        metier: '',
        linkType: '',
    });
    const [linkTypes, setLinkTypes] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [error] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch user data and check if admin
                const token = localStorage.getItem('token');
                const userResponse = await axiosInstance.get('/utilisateurs/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const userData = userResponse.data.user;
                setIsAdmin(userData.role === 'ADMIN');

                // Fetch link types
                const linkTypesResponse = await axiosInstance.get('/liens/types');
                setLinkTypes(linkTypesResponse.data);

                // Fetch existing members
                const membersResponse = await axiosInstance.get('/membres/tous');
                setMembers(membersResponse.data);

                // Check if user is already a member
                const memberExistsResponse = await axiosInstance.get('/membres/existe', {
                    params: { prenom: userData.firstName, date_de_naissance: userData.dateNaissance, sexe: userData.gender },
                });

                if (!memberExistsResponse.data.exists) {
                    // User is not a member, prepare to auto-add
                    setFormData({
                        firstName: userData.firstName,
                        dateNaissance: userData.dateNaissance,
                        gender: userData.gender,
                        email: userData.email,
                        pereName: '',
                        mereName: '',
                        isMarried: '',
                        religion: '',
                        bloodGroup: '',
                        electrophoresis: '',
                        signFa: '',
                        conjointName: '',
                        metier: '',
                        linkType: '',
                    });
                    setLoading(false);
                } else {
                    // User is already a member
                    setMessage('Vous êtes déjà un membre.');
                    navigate('/home');
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des données:', error);
                setMessage('Erreur lors de la récupération des données.');
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [user, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');
    
        try {
            // Choisir la route en fonction du rôle
            const url = isAdmin ? '/admin/member/new-member' : '/user/member/new-member';
            
            // Ajouter un nouveau membre
            await axiosInstance.post(url, {
                prenom: formData.firstName,
                nom: familyData.family_name || '',
                date_de_naissance: formData.dateNaissance,
                id_pere: formData.pereName,
                id_mere: formData.mereName,
                statut_matrimonial: formData.isMarried,
                sexe: formData.gender,
                religion: formData.religion,
                groupe_sanguin: formData.bloodGroup,
                electrophorese: formData.electrophoresis,
                signe_du_fa: formData.signFa,
                conjoint: formData.conjointName,
                profession: formData.metier,
                type_de_lien: isAdmin ? '' : formData.linkType,
            }, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            toast.success('Auto ajout avec succès!');
            navigate('/home'); // Redirection après ajout réussi
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Une erreur est survenue';
            setMessage(errorMessage);
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    const handleEdit = () => {
        setEditMode(true);
    };

    const handleCancel = () => {
        setEditMode(false);
    };

    const handleBack = () => {
        navigate('/home');
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <Container className="my-4">
            <Row>
                <Col md={8} className="mx-auto">
                    <Card>
                        <Card.Header as="h2">Profil de l'Utilisateur</Card.Header>
                        <Card.Body>
                            {error && <Alert variant="danger">{error}</Alert>}
                            {message && <Alert variant="info">{message}</Alert>}
                            {isAdmin && (
                                <Alert variant="success">
                                    Vous êtes connecté en tant qu'Administrateur.
                                </Alert>
                            )}
                            <p><strong>Nom :</strong> {familyData.family_name || 'Non spécifié'}</p> {/* Nom non modifiable */}
                            <p><strong>Prénom :</strong> {formData.firstName || 'Non spécifié'}</p>
                            <p><strong>Email :</strong> {formData.email || 'Non spécifié'}</p>
                            <p><strong>Rôle :</strong> {isAdmin ? 'ADMIN' : 'UTILISATEUR'}</p>
                            {editMode ? (
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group controlId="formfamily_name">
                                        <Form.Label>Nom :</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="family_name"
                                            value={familyData.family_name || ''}
                                            onChange={handleChange}
                                            readOnly
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="formfirstName">
                                        <Form.Label>Prénom :</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                            readOnly
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="formEmail">
                                        <Form.Label>Email :</Form.Label>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            readOnly
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="formDateNaissance">
                                        <Form.Label>Date de naissance :</Form.Label>
                                        <Form.Control
                                            type="date"
                                            name="dateNaissance"
                                            value={formData.dateNaissance}
                                            onChange={handleChange}
                                            required
                                            
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="formGender">
                                        <Form.Label>Sexe :</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Sélectionner...</option>
                                            <option value="Masculin">Masculin</option>
                                            <option value="Féminin">Féminin</option>
                                        </Form.Control>
                                    </Form.Group>
                                    {!isAdmin && (
                                        <Form.Group controlId="formLinkType">
                                            <Form.Label>Type de lien :</Form.Label>
                                            <Form.Control
                                                as="select"
                                                name="linkType"
                                                value={formData.linkType}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="">Sélectionner un type de lien...</option>
                                                {linkTypes.map((type) => (
                                                    <option key={type.id} value={type.id}>
                                                        {type.name}
                                                    </option>
                                                ))}
                                            </Form.Control>
                                        </Form.Group>
                                    )}
                                    <Form.Group controlId="formPereName">
                                        <Form.Label>Père :</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="pereName"
                                            value={formData.pereName}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner un membre...</option>
                                            {members.map((member) => (
                                                <option key={member._id} value={member._id}>
                                                    {member.prenom} {member.nom}
                                                </option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                    <Form.Group controlId="formMereName">
                                        <Form.Label>Mère :</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="mereName"
                                            value={formData.mereName}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner un membre...</option>
                                            {members.map((member) => (
                                                <option key={member._id} value={member._id}>
                                                    {member.prenom} {member.nom}
                                                </option>
                                            ))}
                                        </Form.Control>
                                    </Form.Group>
                                    <Form.Group controlId="formIsMarried">
                                        <Form.Label>Statut matrimonial :</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="isMarried"
                                            value={formData.isMarried}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner...</option>
                                            <option value="Célibataire">Célibataire</option>
                                            <option value="Marié">Marié</option>
                                            <option value="Divorcé">Divorcé</option>
                                            <option value="Veuf">Veuf</option>
                                        </Form.Control>
                                    </Form.Group>
                                    {formData.isMarried === 'Marié' && (
                                        <Form.Group controlId="formConjointName">
                                            <Form.Label>Nom du conjoint :</Form.Label>
                                            <Form.Control
                                                as="select"
                                                name="conjointName"
                                                value={formData.conjointName}
                                                onChange={handleChange}
                                            >
                                                <option value="">Sélectionner un membre...</option>
                                                {members.map((member) => (
                                                    <option key={member._id} value={member._id}>
                                                        {member.prenom} {member.nom}
                                                    </option>
                                                ))}
                                            </Form.Control>
                                        </Form.Group>
                                    )}
                                    <Form.Group controlId="formProfession">
                                        <Form.Label>Profession :</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="metier"
                                            value={formData.metier}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="formReligion">
                                        <Form.Label>Religion :</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="religion"
                                            value={formData.religion}
                                            onChange={handleChange}
                                        >
                                            <option value="">Sélectionner...</option>
                                            <option value="Christianisme">Christianisme</option>
                                            <option value="Islam">Islam</option>
                                            <option value="Hindouisme">Hindouisme</option>
                                            <option value="Bouddhisme">Bouddhisme</option>
                                            <option value="Judaïsme">Judaïsme</option>
                                            <option value="Autre">Autre</option>
                                        </Form.Control>
                                    </Form.Group>
                                    <Form.Group controlId="formBloodGroup">
                                        <Form.Label>Groupe sanguin :</Form.Label>
                                        <Form.Control
                                            as="select"
                                            name="bloodGroup"
                                            value={formData.bloodGroup}
                                            onChange={handleChange}
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
                                        </Form.Control>
                                    </Form.Group>
                                    <Form.Group controlId="formElectrophoresis">
                                        <Form.Label>Électrophorèse :</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="electrophoresis"
                                            value={formData.electrophoresis}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="formFaSign">
                                        <Form.Label>Signe du Fâ :</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="signFa"
                                            value={formData.signFa}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                    <Button type="submit" disabled={loading}>
                                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                                    </Button>
                                    <Button variant="secondary" onClick={handleCancel} className="ms-2">
                                        Annuler
                                    </Button>
                                </Form>
                            ) : (
                                <>
                                    <Button variant="secondary" onClick={handleBack} className="ms-2">
                                        Retour
                                    </Button>
                                </>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <ToastContainer />
        </Container>
    );
};

export default Profiles;