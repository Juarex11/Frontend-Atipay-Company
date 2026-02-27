const API_BASE_URL = 'https://back.mibolsillo.site/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No se encontró el token de autenticación');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json',
  };
};

export const giftService = {

  async getGifts() {
    const response = await fetch(`${API_BASE_URL}/rewards`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Error al cargar los regalos');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  async createGift(formData: FormData) {
    try {
      console.log('Enviando solicitud para crear regalo...');
      const response = await fetch(`${API_BASE_URL}/rewards`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          // No establecer 'Content-Type' cuando se envía FormData, el navegador lo hará automáticamente
          // con el boundary correcto
        },
        body: formData,
      });

      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || 'Error al crear el regalo');
      }

      // Asegurarse de que la respuesta tenga el formato correcto
      const giftData = responseData.data || responseData;
      
      const newGift = {
        id: giftData.id || Date.now(),
        name: giftData.name || formData.get('name') || 'Nuevo Regalo',
        description: giftData.description || formData.get('description') || '',
        redeem_points: giftData.redeem_points || giftData.redeemPoints || Number(formData.get('redeem_points')) || 0,
        stock: giftData.stock || Number(formData.get('stock')) || 0,
        image_url: giftData.image_url || giftData.imageUrl || '',
        created_at: giftData.created_at || new Date().toISOString(),
        updated_at: giftData.updated_at || new Date().toISOString()
      };

      console.log('Regalo creado:', newGift);
      return newGift;
    } catch (error) {
      console.error('Error en createGift:', error);
      throw error;
    }
  },

  async updateGift(id: number, formData: FormData) {
    // Crear un nuevo FormData para no modificar el original
    const requestData = new FormData();

    // Obtener el ID del formulario si existe
    const giftId = formData.get('_id') || id;

    // Copiar todos los campos excepto los especiales
    for (const [key, value] of formData.entries()) {
      if (key !== '_method' && key !== '_id' && key !== 'skip_name_validation') {
        requestData.append(key, value);
      }
    }

    // Si estamos editando y el nombre no ha cambiado, forzar skip_name_validation
    if (formData.get('skip_name_validation') === 'true') {
      requestData.append('skip_name_validation', 'true');
    }

    // Manejar la eliminación de la imagen
    if (formData.get('delete_image') === 'true') {
      requestData.append('delete_image', 'true');
      console.log('Sending delete_image: true to API');
    }

    // Agregar el método PUT para Laravel
    requestData.append('_method', 'PUT');

    const response = await fetch(`${API_BASE_URL}/rewards/${giftId}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Accept': 'application/json',
      },
      body: requestData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Manejar errores de validación (422)
      if (response.status === 422 && errorData.errors) {
        const errorMessages = Object.entries(errorData.errors)
          .map(([field, messages]) => {
            const fieldMessages = Array.isArray(messages) ? messages.join(', ') : String(messages);
            return `${field}: ${fieldMessages}`;
          })
          .join('; ');
        throw new Error(`Error de validación: ${errorMessages}`);
      }

      throw new Error(errorData.message || 'Error al actualizar el regalo');
    }

    const responseData = await response.json();
    console.log('Datos de respuesta de actualización:', responseData);

    // Obtener la URL de la imagen de la respuesta (puede estar en diferentes formatos)
    const imageUrl = responseData.image_url || responseData.imageUrl || 
                    (responseData.data && (responseData.data.image_url || responseData.data.imageUrl)) ||
                    formData.get('image_url');

    // Asegurarse de que la respuesta incluya todos los campos necesarios
    const updatedGift = {
      id: responseData.id || id,
      name: responseData.name || formData.get('name') || '',
      description: responseData.description || formData.get('description') || '',
      redeem_points: Number(responseData.redeem_points) || Number(formData.get('redeem_points')) || 0,
      stock: Number(responseData.stock) || Number(formData.get('stock')) || 0,
      image_url: imageUrl ? `${imageUrl}?t=${new Date().getTime()}` : '',
      created_at: responseData.created_at || new Date().toISOString(),
      updated_at: responseData.updated_at || new Date().toISOString()
    };

    console.log('Regalo actualizado procesado:', updatedGift);
    return updatedGift;
  },

  async deleteGift(id: number) {
    const response = await fetch(`${API_BASE_URL}/rewards/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Error al eliminar el regalo');
    }

    return await response.json().catch(() => ({}));
  },
  // ... (todo tu código anterior: getGifts, createGift, updateGift, deleteGift)

  // NUEVO: Obtener historial de solicitudes del usuario logueado
  async getMyRequests() {
    const response = await fetch(`${API_BASE_URL}/rewards/my-requests`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Error al cargar el historial de recompensas');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  },

  // NUEVO: Solicitar un canje
  async requestRedemption(giftId: number, userId: number) {
    const response = await fetch(`${API_BASE_URL}/rewards/${giftId}/redeem`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json', // Aquí sí es JSON, no FormData
      },
      body: JSON.stringify({ user_id: userId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Error al solicitar el canje');
    }

    return data;
  }
}; // Cierre del objeto giftService

