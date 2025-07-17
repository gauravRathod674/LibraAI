import { FaBell, FaClock, FaBookOpen, FaCalendarAlt, FaCheckCircle } from "react-icons/fa";

//genre
export const sections = [
    {
      name: "COMICS",
      books: [
        { id: 1, title: "Hey, Mary!", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1719020968i/214152430.jpg" },
        { id: 2, title: "Book Ex Machina", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1719020968i/214152430.jpg" },
        { id: 3, title: "Batman: Year One", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1719020968i/214152430.jpg" },
        { id: 4, title: "X-Factor", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1719020968i/214152430.jpg" },
      ],
    },
    {
      name: "ROMANCE",
      books: [
        { id: 11, title: "This Monster of Mine", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1719020968i/214152430.jpg" },
        { id: 12, title: "Lord of a Duke’s Heart", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1719020968i/214152430.jpg" },
        { id: 13, title: "The Notorious Virtues", cover: "https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1719020968i/214152430.jpg" },
      ],
    },
    {
      name: "SCIENCE FICTION",
      books: [
        { id: 21, title: "Dune", cover: "https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg" },
        { id: 22, title: "Neuromancer", cover: "https://covers.openlibrary.org/b/isbn/9780441569595-L.jpg" },
        { id: 23, title: "Foundation", cover: "https://covers.openlibrary.org/b/isbn/9780553293357-L.jpg" },
      ],
    },
  ];
export const favoriteGenres = ["Comics", "Fantasy", "Romance"];
export const browseGenres   = ["Art","Biography","Business","Children's","Classics","Fantasy","Fiction","Mystery","Nonfiction","Poetry","Psychology","Romance","Science Fiction","Self Help","Thriller"];



//borrow-history
export const dummyRecords = [
    {
      id: 1,
      coverImage: "https://covers.openlibrary.org/b/id/7222246-S.jpg",
      title: "Great Expectations",
      author: "Charles Dickens",
      dateBorrowed: "2025-03-01",
      dueDate: "2025-03-15",
      returnDate: null,
    },
    {
      id: 2,
      coverImage: "https://covers.openlibrary.org/b/id/8231990-S.jpg",
      title: "Pride and Prejudice",
      author: "Jane Austen",
      dateBorrowed: "2025-02-10",
      dueDate: "2025-02-24",
      returnDate: "2025-02-22",
    },
    {
      id: 3,
      coverImage: "https://covers.openlibrary.org/b/id/8228691-S.jpg",
      title: "1984",
      author: "George Orwell",
      dateBorrowed: "2025-02-20",
      dueDate: "2025-03-06",
      returnDate: null,
    },
    {
      id: 4,
      coverImage: "https://covers.openlibrary.org/b/id/7222246-S.jpg",
      title: "Great Expectations",
      author: "Charles Dickens",
      dateBorrowed: "2025-03-01",
      dueDate: "2025-05-15",
      returnDate: null,
    },
  ];



//transaction
export const dummyBorrowed = [
    { id:1, coverImage:"https://covers.openlibrary.org/b/id/7222246-S.jpg", title:"Great Expectations", author:"Charles Dickens", dateBorrowed:"2025-03-01", dueDate:"2025-03-15", returnDate:null },
    { id:2, coverImage:"https://covers.openlibrary.org/b/id/8231990-S.jpg", title:"Pride and Prejudice", author:"Jane Austen", dateBorrowed:"2025-02-10", dueDate:"2025-02-24", returnDate:"2025-02-22" },
    { id:3, coverImage:"https://covers.openlibrary.org/b/id/8228691-S.jpg", title:"1984", author:"George Orwell", dateBorrowed:"2025-02-20", dueDate:"2025-03-06", returnDate:null },
    { id:4, coverImage:"https://covers.openlibrary.org/b/id/7222246-S.jpg", title:"Great Expectations", author:"Charles Dickens", dateBorrowed:"2025-03-01", dueDate:"2025-05-15", returnDate:null },
  ];
export const dummyReserved = [
    { id:1, coverImage:"https://covers.openlibrary.org/b/id/7222246-S.jpg", title:"Moby‑Dick", author:"Herman Melville", reservedDate:"2025-04-01", available:true },
    { id:2, coverImage:"https://covers.openlibrary.org/b/id/8231990-S.jpg", title:"Emma", author:"Jane Austen", reservedDate:"2025-03-20", available:false },
  ];



//Search
export const dummyBooks = [
    {
      title: "The Works of Charles Dickens: Great Expectations",
    author: "Charles Dickens",
    coAuthor: "Charles Dickens",
    coverImage: "https://covers.openlibrary.org/b/id/7222246-L.jpg",
    rating: 3.7,
    ratingsCount: 144,
    wantToReadCount: 709,
    firstPublished: 1861,
    editions: 1493,
    },
    {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      coAuthor: null,
      coverImage: "https://covers.openlibrary.org/b/id/8231990-L.jpg",
      rating: 4.2,
      ratingsCount: 894,
      wantToReadCount: 1502,
      firstPublished: 1813,
      editions: 2143,
    },  
    {
      title: "1984",
      author: "George Orwell",
      coAuthor: null,
      coverImage: "https://covers.openlibrary.org/b/id/8228691-L.jpg",
      rating: 4.5,
      ratingsCount: 1043,
      wantToReadCount: 2011,
      firstPublished: 1949,
      editions: 1629,
    }
    
  ];
export const dummyAuthors = [
    {name: "Charles Dickens",
    image: "/dickens.jpg",
    birthDate: "7 February 1812",
    deathDate: "9 June 1870",
    bio:
      "English writer and social critic. He created some of the world's best-known fictional characters and is regarded as the greatest novelist of the Victorian era.",
    worksCount: 4026,
    works: [
      "Great Expectations",
      "A Christmas Carol",
      "Oliver Twist",
      "David Copperfield",
      "Bleak House",
    ]},
    {
      name: "Jane Austen",
      image: "/austen.jpg",
      bio: "Jane Austen was an English novelist known for her six major novels which interpret and critique the British landed gentry at the end of the 18th century.",
      works: ["Pride and Prejudice", "Emma", "Sense and Sensibility"],
    },
  ]; 
export const dummyGenres = [
    {
      name: "Fantasy",
      image: "/fantasy.jpeg",
      description:
        "Fantasy novels transport readers to magical realms filled with mystical creatures, epic battles, and heroic quests.",
    },
    {
      name: "Science Fiction",
      image: "/scifi.jpeg",
      description:
        "Sci-Fi explores futuristic technology, space exploration, time travel, and the impact of science on society.",
    },
    {
      name: "Mystery",
      image: "/mystery.jpeg",
      description:
        "Mystery novels revolve around solving crimes, uncovering secrets, and piecing together thrilling puzzles.",
    },
  ]; 
export const dummyRandomBooks = [
    {
      title: "The Midnight Library",
      author: "Matt Haig",
      coAuthor: null,
      coverImage: "https://covers.openlibrary.org/b/id/11124728-L.jpg",
      rating: 4.2,
      ratingsCount: 14562,
      wantToReadCount: 3200,
      firstPublished: 2020,
      editions: 14,
      moreCovers: [
        "https://covers.openlibrary.org/b/id/11124728-S.jpg",
        "https://covers.openlibrary.org/b/id/11124730-S.jpg",
      ],
    },
    {
      title: "Atomic Habits",
      author: "James Clear",
      coAuthor: null,
      coverImage: "https://covers.openlibrary.org/b/id/10419217-L.jpg",
      rating: 4.8,
      ratingsCount: 32500,
      wantToReadCount: 8800,
      firstPublished: 2018,
      editions: 25,
      moreCovers: [
        "https://covers.openlibrary.org/b/id/10419217-S.jpg",
        "https://covers.openlibrary.org/b/id/10419219-S.jpg",
      ],
    },
    {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      coAuthor: null,
      coverImage: "https://covers.openlibrary.org/b/id/10555643-L.jpg",
      rating: 4.7,
      ratingsCount: 150000,
      wantToReadCount: 45000,
      firstPublished: 1960,
      editions: 35,
      moreCovers: [
        "https://covers.openlibrary.org/b/id/10555643-S.jpg",
        "https://covers.openlibrary.org/b/id/10555644-S.jpg",
      ],
    },
  ];





//book-detail

// data/books.js
export const book =
  {
    title: "Atomic Habits",
    authors: ["James Clear"],
    description:
      "No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results. With inspiring real-life examples and research-backed insights, this book shows you how small changes add up to life-altering results.",
    rating_out_of_5: 4.34,
    ratingsCount: "1,129,858",
    genres: ["Nonfiction", "Self Help", "Psychology"],
    pages: 320,
    firstPublished: "October 16, 2018",
    details: {
      edition: "1st",
      format: "Paperback",
      published: "Penguin Books",
      ASIN: "B07D23CFGR",
      language: "English",
    },
    image_src:
      "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1535115320l/40121378.jpg",
    publish_date: "2018-10-16",
    first_sentence:
      "\"Tiny changes, remarkable results—Atomic Habits shows you how...\"",
    work_description:
      "Atomic Habits offers a proven framework for improving every day, revealing practical strategies for forming good habits, breaking bad ones, and mastering the tiny behaviors that lead to remarkable results.",
    table_of_contents: [
      "Introduction",
      "The Fundamentals: Why Tiny Changes Make a Big Difference",
      "The 1st Law: Make It Obvious",
      "The 2nd Law: Make It Attractive",
      "The 3rd Law: Make It Easy",
      "The 4th Law: Make It Satisfying",
      "Advanced Tactics: How to Go from Being Merely Good to Being Truly Great",
      "Conclusion",
    ],
    subjects: [
      { name: "Nonfiction", url: "/subjects/nonfiction" },
      { name: "Self Help", url: "/subjects/self-help" },
      { name: "Psychology", url: "/subjects/psychology" },
    ],
    edition_notes:
      "Originally published October 16, 2018 by Penguin Books. Includes bibliographical references.",
    published_in: "New York",
    other_titles: [],
    moreEditions: [
      {
        image_src: "//covers.openlibrary.org/b/id/10079233-S.jpg",
        title: "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
        url: "/books/OL12345678M/Atomic_Habits",
        year: "2018",
        publisher: "Penguin Books",
        language: "English",
      },
    ],
    authorInfo: {
      photo: "/james_clear.jpg",
      bio: "James Clear is an author and speaker whose work has helped millions improve their habits. He breaks down complex psychology into simple strategies.",
    },
    readersAlsoEnjoyed: [
      {
        image_src:
          "https://covers.openlibrary.org/b/id/14844561-M.jpg",
        title: "Make Your Bed",
        book_url: "https://openlibrary.org/books/OL57790023M",
        read_url:
          "https://openlibrary.org/books/OL57790023M/-/borrow?action=read",
      },
    ],
    more_by_author: [],
    translation_of: null,
    translated_from: null,
    edition_identifiers: {
      open_library: "OL40121378M",
      isbn_10: "B07D23CFGR",
      oclc: "",
      goodreads: "40121378",
    },
  };






//trendingBooks.jsx
export const trendingBooks = [
  { title: 'The Alchemist', image: '/book1.jpeg' },
  { title: 'Atomic Habits', image: '/book2.jpeg' },
  { title: '1984', image: '/book3.jpeg' },
  { title: 'Sapiens', image: '/book4.jpeg' },
  { title: 'The Power of Now', image: '/book5.jpeg' },
  { title: 'The Alchemist', image: '/book1.jpeg' },
  { title: 'Atomic Habits', image: '/book2.jpeg' },
];

//lovedBooks.jsx
export const lovedBooks = [
    { title: 'The Great Gatsby', image: '/book1.jpeg' },
    { title: 'To Kill a MockingBird', image: '/book2.jpeg' },
    { title: 'Pride and Prejudice', image: '/book3.jpeg' },
    { title: 'The Alchemist', image: '/book4.jpeg' },
    { title: '1984', image: '/book5.jpeg' },
    { title: 'Brave New World', image: '/book1.jpeg' },
    { title: 'Jane Eyre', image: '/book2.jpeg' },  
    { title: 'The Great Gatsby', image: '/book1.jpeg' },
    { title: 'To Kill a MockingBird', image: '/book2.jpeg' },
    { title: 'Pride and Prejudice', image: '/book3.jpeg' },
    { title: 'The Alchemist', image: '/book4.jpeg' },
    { title: '1984', image: '/book5.jpeg' },
    { title: 'Brave New World', image: '/book1.jpeg' },
    { title: 'Jane Eyre', image: '/book2.jpeg' },
  
  ];

//classicBooks.jsx
export const classicBooks = [
  { title: 'Moby-Dick', image: '/book1.jpeg' },
  { title: 'War and Peace', image: '/book2.jpeg' },
  { title: 'The Odyssey', image: '/book3.jpeg' },
  { title: 'Crime', image: '/book4.jpeg' },
  { title: 'Les Misérables', image: '/book5.jpeg' },
  { title: 'Moby-Dick', image: '/book1.jpeg' },
  { title: 'War and Peace', image: '/book2.jpeg' },
  { title: 'The Odyssey', image: '/book3.jpeg' },
];



//research
export const papers = [
  {
    title: "Deep Learning for NLP",
    subtitle: "Artificial Intelligence",
    author: "Dr. Alice Johnson",
    date: "2023-04-01",
    description: "Exploring advanced neural networks for natural language understanding in real-world applications across industries like virtual assistants, sentiment analysis, and automated translation."
  },
  {
    title: "Quantum Computing: A New Era",
    subtitle: "Quantum Technology",
    author: "Prof. Bob Smith",
    date: "2022-11-15",
    description: "Introduction to qubits, entanglement, and the potential quantum algorithms that could outperform classical computing in cryptography, modeling, and optimization problems."
  },
  {
    title: "Climate Change and Data Science",
    subtitle: "Environmental Science",
    author: "Dr. Clara Green",
    date: "2021-06-10",
    description: "Leveraging machine learning and big data analytics to track environmental impact, forecast climate trends, and design sustainable solutions."
  },
  {
    title: "Blockchain in Education",
    subtitle: "Blockchain Technology",
    author: "Dr. Daniel Kim",
    date: "2022-01-18",
    description: "Exploring how decentralized ledger technology is transforming credentialing, academic records, and institutional transparency."
  },
  {
    title: "AI and Healthcare",
    subtitle: "Medical Technology",
    author: "Dr. Emily Rose",
    date: "2023-03-22",
    description: "A comprehensive look at how artificial intelligence is reshaping diagnostics, treatment recommendations, and patient monitoring in modern healthcare."
  },
  {
    title: "Cybersecurity Frameworks",
    subtitle: "Information Security",
    author: "Dr. Frank Knight",
    date: "2021-09-30",
    description: "In-depth review of modern frameworks to secure enterprise systems against evolving digital threats and vulnerabilities."
  },
  {
    title: "Edge Computing in IoT",
    subtitle: "Internet of Things",
    author: "Dr. Grace Liu",
    date: "2022-07-05",
    description: "Strategies for improving processing speed and reliability by deploying computing resources closer to data-generating IoT devices."
  },
  {
    title: "Ethical AI Development",
    subtitle: "Tech Ethics",
    author: "Dr. Henry Cruz",
    date: "2023-02-12",
    description: "Best practices and ethical guidelines to ensure responsible creation, deployment, and oversight of artificial intelligence."
  },
  {
    title: "Neural Interfaces: The Future",
    subtitle: "Neurotechnology",
    author: "Dr. Ivy Zhang",
    date: "2021-12-07",
    description: "The current state and future of brain-computer interfaces that connect human minds directly to digital systems."
  },
  {
    title: "Robotics and Machine Learning",
    subtitle: "Automation",
    author: "Dr. Jack Reyes",
    date: "2023-05-10",
    description: "Analyzing the synergy between robotics and machine learning in building adaptive, autonomous intelligent systems."
  }
];




  


//notification
export const allNotifications = [
    { id:1, type: "New Arrivals", icon: <FaBookOpen />, text: "New eBook 'Understanding React' added", date: "Today 10:00 AM" },
    { id:2, type: "Overdue",         icon: <FaClock />,    text: "Your copy of '1984' is overdue",            date: "Yesterday 3:45 PM" },
    { id:3, type: "Return Reminder", icon: <FaCalendarAlt />, text: "Reminder: 'Atomic Habits' due in 2 days", date: "Today 9:00 AM" },
    { id:4, type: "Reserved Available", icon: <FaCheckCircle />, text: "'Pride and Prejudice' is now available", date: "Today 8:30 AM" },
    { id:5, type: "Late Fees",       icon: <FaBell />,     text: "Late fee $2 accrued on 'Great Expectations'", date: "Today 11:15 AM" },
  ];
export const filters = [
    "New Arrivals","Overdue","Return Reminder","Reserved Available","Late Fees"
  ];


//research detail
export const paper = {
        title:
            "Oracle-MNIST: A Realistic Image Dataset for Machine Learning in the Real World",
        authors: ["Bo Wang", "Li Deng"],
        venue: "arXiv",
        year: 2021,
        abstract:
            "We introduce Oracle-MNIST, a dataset designed to reflect real-world conditions of machine learning systems. It addresses challenges such as noise, occlusion, and domain shift, offering a benchmark for evaluating robustness and generalization. Lorem ipsum dolor sit amet, consectetur adipiscing elit. We introduce Oracle-MNIST, a dataset designed to reflect real-world conditions of machine learning systems. It addresses challenges such as noise, occlusion, and domain shift, offering a benchmark for evaluating robustness and generalization. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Integer tincidunt, nunc ac interdum imperdiet, ipsum arcu sollicitudin enim, ac pretium ex sem nec purus. In hac habitasse platea dictumst. Vivamus porttitor, neque vitae lacinia blandit, nisi libero aliquam turpis, nec lobortis eros sem at eros. Sed in facilisis libero, nec dictum neque. Vestibulum posuere porttitor ex, in pulvinar ligula vestibulum et. Aenean vel vestibulum nunc. Donec feugiat, purus at aliquam egestas, odio sapien scelerisque nisi, ac laoreet sapien justo non metus.Suspendisse eget lacus a ",
        topics: ["Machine Learning", "Dataset", "Robustness", "Generalization"],
        references: [
            {
                title: "Deep Residual Learning for Image Recognition",
                authors: ["Kaiming He", "Xiangyu Zhang"],
                year: 2016,
                link: "#",
                description:
                    "This foundational paper introduced ResNet... revolutionized computer vision and became a standard baseline in many tasks.",
            },
            {
                title: "Understanding Deep Learning Requires Rethinking Generalization",
                authors: ["Chiyuan Zhang", "Samy Bengio"],
                year: 2017,
                link: "#",
                description:
                    "This paper challenges conventional beliefs... urges a reevaluation of how we understand model complexity and learning behavior.",
            },
        ],
        relatedPapers: [
            {
                title: "Robustness of Neural Networks under Real-World Conditions",
                authors: ["Jane Doe"],
                link: "#",
                description:
                    "An exploration into the behavior of neural networks under real-world perturbations...",
            },
            {
                title: "Domain Adaptation for Visual Recognition",
                authors: ["John Smith"],
                link: "#",
                description:
                    "This work surveys domain adaptation techniques in visual recognition...",
            },
        ],
    };