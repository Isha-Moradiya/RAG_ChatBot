import { adminAuth } from '../lib/firebase'; 

export const verifyFirebaseToken = async (request) => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { 
      success: false, 
      code: 401,
      message: "Authorization header missing or invalid" 
    };
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return { 
      success: true,
      user: decodedToken,
      userId: decodedToken.uid
    };
  } catch (err) {
    let message = "Invalid token";
    if (err.code === 'auth/id-token-expired') {
      message = "Token expired";
    } else if (err.code === 'auth/argument-error') {
      message = "Malformed token";
    }

    return { 
      success: false, 
      code: 401,
      message 
    };
  }
};