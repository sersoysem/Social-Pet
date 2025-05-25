#!/usr/bin/env python3
"""
Firebase'e örnek veteriner verileri ekleyen script
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from firebase_init import db

def add_sample_vets():
    """Örnek veteriner verilerini Firebase'e ekle"""
    
    sample_vets = [
        {
            "name": "Dr. Selim Erdem",
            "specialization": "Cerrahi ve Ortopedi Uzmanı",
            "address": "Cumhuriyet Cad. No:55, Kadıköy/İstanbul",
            "clinic": "Hayat Veteriner Kliniği",
            "phone": "0224 234 56 78",
            "rating": "4.8",
            "experience": "12 yıl deneyim",
            "image": "https://randomuser.me/api/portraits/men/20.jpg"
        },
        {
            "name": "Dr. Ayşe Yılmaz",
            "specialization": "Kedi ve Köpek Uzmanı",
            "address": "Bağdat Cad. No:123, Kadıköy/İstanbul",
            "clinic": "Pet Life Veteriner Kliniği",
            "phone": "0216 555 44 33",
            "rating": "4.9",
            "experience": "8 yıl deneyim",
            "image": "https://randomuser.me/api/portraits/women/25.jpg"
        },
        {
            "name": "Dr. Mehmet Kaya",
            "specialization": "Kuş ve Egzotik Hayvan Uzmanı",
            "address": "Barbaros Bulvarı No:67, Beşiktaş/İstanbul",
            "clinic": "Exotic Pet Clinic",
            "phone": "0212 444 33 22",
            "rating": "4.7",
            "experience": "15 yıl deneyim",
            "image": "https://randomuser.me/api/portraits/men/32.jpg"
        },
        {
            "name": "Dr. Zeynep Demir",
            "specialization": "Köpek Cerrahisi Uzmanı",
            "address": "Çamlıca Cad. No:89, Üsküdar/İstanbul",
            "clinic": "Çamlıca Veteriner Kliniği",
            "phone": "0216 777 66 55",
            "rating": "4.6",
            "experience": "10 yıl deneyim",
            "image": "https://randomuser.me/api/portraits/women/18.jpg"
        },
        {
            "name": "Dr. Can Öztürk",
            "specialization": "Kedi Diş Sağlığı Uzmanı",
            "address": "Nişantaşı Cad. No:45, Şişli/İstanbul",
            "clinic": "Modern Pet Dental Clinic",
            "phone": "0212 333 22 11",
            "rating": "4.5",
            "experience": "6 yıl deneyim",
            "image": "https://randomuser.me/api/portraits/men/40.jpg"
        },
        {
            "name": "Dr. Elif Yıldız",
            "specialization": "Küçük Hayvan İç Hastalıkları",
            "address": "Ataşehir Bulvarı No:156, Ataşehir/İstanbul",
            "clinic": "Ataşehir Veteriner Kliniği",
            "phone": "0216 888 77 66",
            "rating": "4.8",
            "experience": "9 yıl deneyim",
            "image": "https://randomuser.me/api/portraits/women/30.jpg"
        }
    ]
    
    try:
        # Firebase'e verileri ekle
        for i, vet in enumerate(sample_vets):
            doc_ref = db.collection("Vets").document()
            doc_ref.set(vet)
            print(f"✅ {vet['name']} başarıyla eklendi (Doc ID: {doc_ref.id})")
        
        print(f"\n🎉 Toplam {len(sample_vets)} veteriner başarıyla Firebase'e eklendi!")
        
    except Exception as e:
        print(f"❌ Hata oluştu: {e}")

if __name__ == "__main__":
    print("🔥 Firebase'e örnek veteriner verileri ekleniyor...")
    add_sample_vets() 