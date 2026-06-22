import { useEffect, useState } from 'react';
import Button from '../../../components/atoms/Button/Button';
import { createUser, getAllUsers, toggleUserStatus, updateUserAsAdmin } from '../../../services/userService';
import './EmployeesView.css';

const emptyForm = {
    displayName: '',
    employeeId: '',
    password: '',
    role: 'vendedor',
    avatar: '',
    isActive: true
};

const getErrorMessage = (error, fallback) => {
    const data = error?.response?.data;
    return data?.message || data?.errors?.[0]?.msg || error?.message || fallback;
};

export default function EmployeesView() {
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingUserId, setEditingUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const loadEmployees = async () => {
        try {
            setError('');
            const [sellers, baristas] = await Promise.all([
                getAllUsers({ role: 'vendedor', limit: 100 }),
                getAllUsers({ role: 'barista', limit: 100 })
            ]);

            const users = [...(sellers?.users || []), ...(baristas?.users || [])]
                .sort((a, b) => a.displayName.localeCompare(b.displayName));

            setEmployees(users);
        } catch (error) {
            setError(getErrorMessage(error, 'No se pudieron cargar los empleados.'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmployees();
    }, []);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;
        setFormData((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingUserId(null);
    };

    const handleEdit = (employee) => {
        setEditingUserId(employee._id);
        setFormData({
            displayName: employee.displayName || '',
            employeeId: employee.employeeId || '',
            password: '',
            role: employee.role || 'vendedor',
            avatar: employee.avatar || '',
            isActive: Boolean(employee.isActive)
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setNotice('');

        const payload = {
            displayName: formData.displayName.trim(),
            employeeId: formData.employeeId.trim(),
            role: formData.role,
            avatar: formData.avatar.trim(),
            isActive: formData.isActive
        };

        if (formData.password.trim()) {
            payload.password = formData.password.trim();
        }

        try {
            if (editingUserId) {
                await updateUserAsAdmin(editingUserId, payload);
                setNotice('Empleado actualizado correctamente.');
            } else {
                await createUser(payload);
                setNotice('Empleado creado correctamente.');
            }

            resetForm();
            await loadEmployees();
        } catch (error) {
            setError(getErrorMessage(error, 'No se pudo guardar el empleado.'));
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (employee) => {
        try {
            setError('');
            setNotice('');
            await toggleUserStatus(employee._id);
            setNotice(`${employee.displayName} ${employee.isActive ? 'desactivado' : 'activado'} correctamente.`);
            await loadEmployees();
        } catch (error) {
            setError(getErrorMessage(error, 'No se pudo cambiar el estado del empleado.'));
        }
    };

    return (
        <section className="admin-employees-view">
            <div className="admin-employees-view__header">
                <div>
                    <p className="admin-employees-view__eyebrow">Equipo</p>
                    <h2>Empleados</h2>
                </div>
                <Button variant="secondary" onClick={loadEmployees}>Actualizar</Button>
            </div>

            {error && <div className="admin-employees-view__error">{error}</div>}
            {notice && <div className="admin-employees-view__notice">{notice}</div>}

            <div className="admin-employees-view__grid">
                <form className="admin-employee-form" onSubmit={handleSubmit}>
                    <h3>{editingUserId ? 'Editar empleado' : 'Nuevo empleado'}</h3>

                    <label htmlFor="employee-name">Nombre</label>
                    <input id="employee-name" name="displayName" value={formData.displayName} onChange={handleChange} required />

                    <label htmlFor="employee-id">Número de empleado</label>
                    <input id="employee-id" name="employeeId" value={formData.employeeId} onChange={handleChange} placeholder="EMP-01" required />

                    <label htmlFor="employee-password">PIN / Contraseña</label>
                    <input
                        id="employee-password"
                        name="password"
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        minLength="5"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder={editingUserId ? 'Dejar vacío para conservar' : 'Mínimo 5 dígitos'}
                        required={!editingUserId}
                    />

                    <label htmlFor="employee-role">Rol</label>
                    <div className="admin-employee-form__select-wrap">
                        <select id="employee-role" name="role" value={formData.role} onChange={handleChange} required>
                            <option value="vendedor">Vendedor</option>
                            <option value="barista">Barista</option>
                        </select>
                    </div>

                    <label htmlFor="employee-avatar">Avatar</label>
                    <input id="employee-avatar" name="avatar" value={formData.avatar} onChange={handleChange} placeholder="https://placehold.co/100x100.png" required />

                    <label className="admin-employee-form__checkbox">
                        <input name="isActive" type="checkbox" checked={formData.isActive} onChange={handleChange} />
                        Empleado activo
                    </label>

                    <div className="admin-employee-form__actions">
                        <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
                        {editingUserId && <Button variant="secondary" onClick={resetForm}>Cancelar</Button>}
                    </div>
                </form>

                <div className="admin-employees-list">
                    {loading ? (
                        <div className="admin-employees-list__state">Cargando empleados...</div>
                    ) : employees.length === 0 ? (
                        <div className="admin-employees-list__state">No hay empleados registrados.</div>
                    ) : (
                        employees.map((employee) => (
                            <article className="admin-employee-card" key={employee._id}>
                                <img src={employee.avatar} alt={employee.displayName} width="54" height="54" loading="lazy" decoding="async" />
                                <div>
                                    <h3>{employee.displayName}</h3>
                                    <p>{employee.employeeId} · {employee.role}</p>
                                </div>
                                <span className={`admin-employee-card__status ${employee.isActive ? 'is-active' : 'is-inactive'}`}>
                                    {employee.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                                <div className="admin-employee-card__actions">
                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(employee)}>Editar</Button>
                                    <Button variant={employee.isActive ? 'danger' : 'primary'} size="sm" onClick={() => handleToggleStatus(employee)}>
                                        {employee.isActive ? 'Desactivar' : 'Activar'}
                                    </Button>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
