import { Component } from '@angular/core';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent {

  // constructor
   trackByAnalytic(index: number, item: any) {
    return item.title || index;
  }

  trackByOrder(index: number, item: any) {
    return item.id || index;
  }

  trackByTransaction(index: number, item: any) {
    return item.title || index;
  }

  recentOrder = [
  {
    "id": "84564564",
    "name": "Camera Lens",
    "quantity": "40",
    "status": "Rejected",
    "status_type": "bg-danger",
    "amount": "$40,570"
  },
  {
    "id": "84564786",
    "name": "Laptop",
    "quantity": "300",
    "status": "Pending",
    "status_type": "bg-warning",
    "amount": "$180,139"
  },
  {
    "id": "84564522",
    "name": "Mobile",
    "quantity": "355",
    "status": "Approved",
    "status_type": "bg-success",
    "amount": "$50,139"
  },
  {
    "id": "84564564",
    "name": "Camera Lens",
    "quantity": "40",
    "status": "Rejected",
    "status_type": "bg-danger",
    "amount": "$40,570"
  },
  {
    "id": "84564786",
    "name": "Laptop",
    "quantity": "300",
    "status": "Pending",
    "status_type": "bg-warning",
    "amount": "$180,139"
  },
  {
    "id": "84564522",
    "name": "Mobile",
    "quantity": "355",
    "status": "Approved",
    "status_type": "bg-success",
    "amount": "$50,139"
  },
  {
    "id": "84564564",
    "name": "Camera Lens",
    "quantity": "40",
    "status": "Rejected",
    "status_type": "bg-danger",
    "amount": "$40,570"
  },
  {
    "id": "84564786",
    "name": "Laptop",
    "quantity": "300",
    "status": "Pending",
    "status_type": "bg-warning",
    "amount": "$180,139"
  },
  {
    "id": "84564522",
    "name": "Mobile",
    "quantity": "355",
    "status": "Approved",
    "status_type": "bg-success",
    "amount": "$50,139"
  },
  {
    "id": "84564786",
    "name": "Laptop",
    "quantity": "300",
    "status": "Pending",
    "status_type": "bg-warning",
    "amount": "$180,139"
  }
]


  AnalyticEcommerce = [
    {
      title: 'Total Page Views',
      amount: '4,42,236',
      background: 'bg-light-primary ',
      border: 'border-primary',
      icon: 'rise',
      percentage: '59.3%',
      color: 'text-primary',
      number: '35,000'
    },
    {
      title: 'Total Users',
      amount: '78,250',
      background: 'bg-light-primary ',
      border: 'border-primary',
      icon: 'rise',
      percentage: '70.5%',
      color: 'text-primary',
      number: '8,900'
    },
    {
      title: 'Total Order',
      amount: '18,800',
      background: 'bg-light-warning ',
      border: 'border-warning',
      icon: 'fall',
      percentage: '27.4%',
      color: 'text-warning',
      number: '1,943'
    },
    {
      title: 'Total Sales',
      amount: '$35,078',
      background: 'bg-light-warning ',
      border: 'border-warning',
      icon: 'fall',
      percentage: '27.4%',
      color: 'text-warning',
      number: '$20,395'
    }
  ];

  transaction = [
    {
      background: 'text-success bg-light-success',
      icon: 'gift',
      title: 'Order #002434',
      time: 'Today, 2:00 AM',
      amount: '+ $1,430',
      percentage: '78%'
    },
    {
      background: 'text-primary bg-light-primary',
      icon: 'message',
      title: 'Order #984947',
      time: '5 August, 1:45 PM',
      amount: '- $302',
      percentage: '8%'
    },
    {
      background: 'text-danger bg-light-danger',
      icon: 'setting',
      title: 'Order #988784',
      time: '7 hours ago',
      amount: '- $682',
      percentage: '16%'
    }
  ];
}
