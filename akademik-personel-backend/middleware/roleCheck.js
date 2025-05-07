/**
 * Rol kontrolü middleware'i
 * Bu middleware, kullanıcının belirli rollere sahip olup olmadığını kontrol eder
 * Türkçe ve İngilizce rol isimleri arasında eşleştirme yapar
 */
const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    // Kullanıcı yetkilendirme middleware'ından geçmediyse
    if (!req.user) {
      return res.status(401).json({ message: "Yetkilendirme gerekli" });
    }

    // Rol isimlerini standardize et
    const roleMappings = {
      // Türkçe karakterli ve karaktersiz versiyonlar tek anahtara eşleştirildi
      "jüri üyesi": "jury",
      "juri üyesi": "jury",
      jury: "jury",
      yönetici: "manager",
      yonetici: "manager",
      manager: "manager",
      admin: "admin",
      aday: "candidate",
      candidate: "candidate",
    };

    // Kullanıcının rol ismini standardize edilmiş formata dönüştür
    const userRole = req.user.role.toLowerCase();
    const standardizedUserRole = roleMappings[userRole] || userRole;

    // İzin verilen rolleri standardize edilmiş formata dönüştür
    const standardizedAllowedRoles = allowedRoles.map(
      (role) => roleMappings[role.toLowerCase()] || role.toLowerCase()
    );

    // Kullanıcı rolünün izin verilen roller arasında olup olmadığını kontrol et
    if (standardizedAllowedRoles.includes(standardizedUserRole)) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "Bu işlem için yetkiniz bulunmamaktadır" });
    }
  };
};

module.exports = { roleCheck };
