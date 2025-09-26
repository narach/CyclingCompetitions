import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Language codes: 'en' (English), 'ru' (Russian), 'mne' (Montenegrin)
// We intentionally use 'mne' as requested for display and storage.

const resources = {
  en: {
    translation: {
      nav: {
        events: 'Events',
        admin: 'Admin'
      },
      common: {
        view: 'View',
        register: 'Register',
        cancel: 'Cancel',
        dash: '—'
      },
      home: {
        title: 'Cycling community and competitions in Montenegro',
        p1: 'Welcome to Cycling MNE, a community-driven platform dedicated to organizing and promoting amateur cycling competitions across Montenegro. Our goal is to connect riders, clubs, and volunteers to make it easy to discover events, register to race, and share routes and results.',
        p2: 'From coastal rides along the Adriatic to challenging climbs in the mountains, Montenegro offers a diverse landscape for cyclists of all levels. We aim to showcase these routes, provide clear event information, and keep logistics simple for organizers and participants alike.',
        p3: 'With this platform, you can browse upcoming events, register quickly, and stay informed about schedules and updates. Organizers can create events in minutes and manage registrations without hassle.',
        p4: 'As an MVP, we focus on the essentials: creating events, registering riders, and listing participants. We welcome feedback from the community to help us improve and grow responsibly.',
        p5: 'Whether you ride for fitness, adventure, or competition, Cycling MNE is here to support your next ride in Montenegro.'
      },
      events: {
        title: 'Events',
        loading: 'Loading events…',
        loadError: 'Failed to load events: {{error}}',
        none: 'No events available yet.',
        table: {
          when: 'When',
          name: 'Name',
          description: 'Description',
          route: 'Route',
          actions: 'Actions'
        }
      },
      admin: {
        title: 'Admin',
        create: 'Create event',
        labels: {
          name: 'Event name',
          date: 'Event date',
          time: 'Event time',
          description: 'Event description',
          route: 'Event route (GPX file)',
          location: 'Event location (GPS)'
        },
        success: 'Event created successfully',
        failure: 'Failed to create event: {{error}}',
        save: 'Save event'
      },
      register: {
        title: 'Register',
        titleTo: 'Register to {{event}}',
        invalidEventId: 'Invalid event id in URL.',
        backToEvents: 'Back to events',
        when: 'When',
        description: 'Description',
        route: 'Route',
        view: 'View',
        form: {
          name: 'Name',
          surname: 'Surname',
          email: 'Email',
          phone: 'Phone',
          gender: 'Gender',
          male: 'Male',
          female: 'Female',
          birthYear: 'Birth year',
          club: 'Club',
          country: 'Country',
          city: 'City'
        },
        errors: {
          invalidEvent: 'Invalid event',
          nameRequired: 'Name is required',
          surnameRequired: 'Surname is required',
          emailRequired: 'Email is required',
          invalidEmail: 'Invalid email',
          invalidPhone: 'Invalid phone',
          birthYearInteger: 'Birth year must be integer',
          birthYearRange: 'Birth year out of range'
        },
        buttons: {
          register: 'Register',
          cancel: 'Cancel'
        }
      },
      registerCompleted: {
        title: 'Registration Completed',
        noData: 'No registration data found.',
        startNumber: 'Start Number',
        fields: {
          name: 'Name',
          email: 'Email',
          phone: 'Phone',
          gender: 'Gender',
          birthYear: 'Birth Year',
          club: 'Club',
          country: 'Country',
          city: 'City',
          created: 'Created',
          updated: 'Updated'
        },
        backToRegistration: 'Back to registration',
        backToEvents: 'Back to events'
      }
    }
  },
  ru: {
    translation: {
      nav: {
        events: 'События',
        admin: 'Админ'
      },
      common: {
        view: 'Открыть',
        register: 'Регистрация',
        cancel: 'Отмена',
        dash: '—'
      },
      home: {
        title: 'Сообщество и соревнования по велоспорту в Черногории',
        p1: 'Добро пожаловать в Cycling MNE — платформу сообщества, посвящённую организации и продвижению любительских велосоревнований по всей Черногории. Наша цель — объединить райдеров, клубы и волонтёров, чтобы упростить поиск событий, регистрацию и обмен маршрутами и результатами.',
        p2: 'От побережья Адриатики до сложных подъёмов в горах — Черногория предлагает разнообразные маршруты для велосипедистов любого уровня. Мы стремимся показать эти маршруты, предоставить понятную информацию о событиях и упростить логистику для организаторов и участников.',
        p3: 'С помощью этой платформы вы можете просматривать предстоящие события, быстро регистрироваться и быть в курсе расписаний и обновлений. Организаторы могут создавать события за минуты и без труда управлять регистрациями.',
        p4: 'Как MVP, мы сосредоточены на essentials: создании событий, регистрации участников и списках. Мы приветствуем обратную связь сообщества для ответственного развития.',
        p5: 'Независимо от того, катаетесь ли вы для фитнеса, приключений или соревнований, Cycling MNE поможет вашей следующей поездке в Черногории.'
      },
      events: {
        title: 'События',
        loading: 'Загрузка событий…',
        loadError: 'Не удалось загрузить события: {{error}}',
        none: 'Пока нет доступных событий.',
        table: {
          when: 'Когда',
          name: 'Название',
          description: 'Описание',
          route: 'Маршрут',
          actions: 'Действия'
        }
      },
      admin: {
        title: 'Админ',
        create: 'Создать событие',
        labels: {
          name: 'Название события',
          date: 'Дата события',
          time: 'Время события',
          description: 'Описание события',
          route: 'Маршрут события (GPX fajl)',
          location: 'Локация события (GPS)'
        },
        success: 'Событие успешно создано',
        failure: 'Не удалось создать событие: {{error}}',
        save: 'Сохранить событие'
      },
      register: {
        title: 'Регистрация',
        titleTo: 'Регистрация на {{event}}',
        invalidEventId: 'Неверный ID события в URL.',
        backToEvents: 'Назад к событиям',
        when: 'Когда',
        description: 'Описание',
        route: 'Маршрут',
        view: 'Открыть',
        form: {
          name: 'Имя',
          surname: 'Фамилия',
          email: 'Email',
          phone: 'Телефон',
          gender: 'Пол',
          male: 'Мужской',
          female: 'Женский',
          birthYear: 'Год рождения',
          club: 'Клуб',
          country: 'Страна',
          city: 'Город'
        },
        errors: {
          invalidEvent: 'Неверное событие',
          nameRequired: 'Имя обязательно',
          surnameRequired: 'Фамилия обязательна',
          emailRequired: 'Email обязателен',
          invalidEmail: 'Неверный email',
          invalidPhone: 'Неверный телефон',
          birthYearInteger: 'Год рождения должен быть целым числом',
          birthYearRange: 'Год рождения вне диапазона'
        },
        buttons: {
          register: 'Зарегистрироваться',
          cancel: 'Отмена'
        }
      },
      registerCompleted: {
        title: 'Регистрация завершена',
        noData: 'Данные регистрации не найдены.',
        startNumber: 'Стартовый номер',
        fields: {
          name: 'Имя',
          email: 'Email',
          phone: 'Телефон',
          gender: 'Пол',
          birthYear: 'Год рождения',
          club: 'Клуб',
          country: 'Страна',
          city: 'Город',
          created: 'Создано',
          updated: 'Обновлено'
        },
        backToRegistration: 'Назад к регистрации',
        backToEvents: 'Назад к событиям'
      }
    }
  },
  mne: {
    translation: {
      nav: {
        events: 'Događaji',
        admin: 'Admin'
      },
      common: {
        view: 'Prikaži',
        register: 'Registruj se',
        cancel: 'Otkaži',
        dash: '—'
      },
      home: {
        title: 'Biciklistička zajednica i takmičenja u Crnoj Gori',
        p1: 'Dobro došli na Cycling MNE, platformu zajednice posvećenu organizaciji i promociji amaterskih biciklističkih takmičenja širom Crne Gore. Naš cilj je da povežemo vozače, klubove i volontere kako bismo olakšali pronalaženje događaja, registraciju i dijeljenje ruta i rezultata.',
        p2: 'Od jadranske obale do izazovnih uspona u planinama, Crna Gora nudi raznolike staze za sve nivoe. Želimo da prikažemo ove rute, pružimo jasne informacije o događajima i pojednostavimo logistiku za organizatore i učesnike.',
        p3: 'Uz ovu platformu možete pretraživati predstojeće događaje, brzo se registrovati i biti informisani o rasporedima i novostima. Organizatori mogu za nekoliko minuta kreirati događaje i jednostavno upravljati registracijama.',
        p4: 'Kao MVP, fokusirani smo na osnove: kreiranje događaja, registraciju vozača i liste učesnika. Dobrodošli su komentari zajednice kako bismo odgovorno napredovali.',
        p5: 'Bilo da vozite radi kondicije, avanture ili takmičenja, Cycling MNE je tu da podrži vašu sljedeću vožnju u Crnoj Gori.'
      },
      events: {
        title: 'Događaji',
        loading: 'Učitavanje događaja…',
        loadError: 'Nije moguće učitati događaje: {{error}}',
        none: 'Još nema dostupnih događaja.',
        table: {
          when: 'Kada',
          name: 'Naziv',
          description: 'Opis',
          route: 'Ruta',
          actions: 'Akcije'
        }
      },
      admin: {
        title: 'Admin',
        create: 'Kreiraj događaj',
        labels: {
          name: 'Naziv događaja',
          date: 'Datum događaja',
          time: 'Vrijeme događaja',
          description: 'Opis događaja',
          route: 'Ruta događaja (GPX fajl)',
          location: 'Lokacija događaja (GPS)'
        },
        success: 'Događaj je uspješno kreiran',
        failure: 'Neuspješno kreiranje događaja: {{error}}',
        save: 'Sačuvaj događaj'
      },
      register: {
        title: 'Registracija',
        titleTo: 'Registracija za {{event}}',
        invalidEventId: 'Nevažeći ID događaja u URL-u.',
        backToEvents: 'Nazad na događaje',
        when: 'Kada',
        description: 'Opis',
        route: 'Ruta',
        view: 'Prikaži',
        form: {
          name: 'Ime',
          surname: 'Prezime',
          email: 'Email',
          phone: 'Telefon',
          gender: 'Pol',
          male: 'Muško',
          female: 'Žensko',
          birthYear: 'Godina rođenja',
          club: 'Klub',
          country: 'Država',
          city: 'Grad'
        },
        errors: {
          invalidEvent: 'Nevažeći događaj',
          nameRequired: 'Ime je obavezno',
          surnameRequired: 'Prezime je obavezno',
          emailRequired: 'Email je obavezan',
          invalidEmail: 'Nevažeći email',
          invalidPhone: 'Nevažeći telefon',
          birthYearInteger: 'Godina rođenja mora biti cijeli broj',
          birthYearRange: 'Godina rođenja je van opsega'
        },
        buttons: {
          register: 'Registruj se',
          cancel: 'Otkaži'
        }
      },
      registerCompleted: {
        title: 'Registracija završena',
        noData: 'Podaci o registraciji nijesu pronađeni.',
        startNumber: 'Startni broj',
        fields: {
          name: 'Ime',
          email: 'Email',
          phone: 'Telefon',
          gender: 'Pol',
          birthYear: 'Godina rođenja',
          club: 'Klub',
          country: 'Država',
          city: 'Grad',
          created: 'Kreirano',
          updated: 'Ažurirano'
        },
        backToRegistration: 'Nazad na registraciju',
        backToEvents: 'Nazad na događaje'
      }
    }
  }
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ru', 'mne'],
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    }
  })

export default i18n


